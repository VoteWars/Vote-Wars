import { NextResponse } from 'next/server';
import { adminDb, requireAdminRequest } from '@/lib/server';
import { removeBrandLogo } from '@/lib/brand-storage';

const ALLOWED_DURATIONS = [24, 48, 72, 168];

export async function POST(req: Request) {
  try {
    if (!await requireAdminRequest(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, action, position, duration } = await req.json();
    if (typeof id !== 'string' || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'reject') {
      const { data: deleted, error } = await adminDb
        .from('brand_applications')
        .delete()
        .eq('id', id)
        .eq('status', 'pending')
        .select('id,logo_url')
        .maybeSingle();
      if (error) throw error;
      if (!deleted) {
        return NextResponse.json(
          { error: 'Pending application not found; it may already be reviewed.' },
          { status: 404 }
        );
      }

      const logoRemoved = await removeBrandLogo(deleted.logo_url);
      return NextResponse.json({
        ok: true,
        ...(logoRemoved ? {} : { warning: 'Application deleted, but its logo could not be removed from storage.' }),
      });
    }

    const numericPosition = Number(position);
    const numericDuration = Number(duration);
    if (
      !Number.isInteger(numericPosition) || numericPosition < 1 || numericPosition > 20 ||
      !ALLOWED_DURATIONS.includes(numericDuration)
    ) {
      return NextResponse.json(
        { error: 'Position must be 1–20 and duration must be valid.' },
        { status: 400 }
      );
    }

    const { error } = await adminDb.rpc('approve_brand_application', {
      p_application: id,
      p_position: numericPosition,
      p_duration_hours: numericDuration,
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Brand application action failed:', error);
    return NextResponse.json({ error: 'Could not process application. Please try again.' }, { status: 500 });
  }
}

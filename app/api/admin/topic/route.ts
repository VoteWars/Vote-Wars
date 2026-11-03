import { NextResponse } from 'next/server';
import { adminDb, requireAdminRequest } from '@/lib/server';
import { optionImagePathFromUrl, removeOptionImages } from '@/lib/option-images';

const hours = [24, 48, 72, 168];

export async function POST(req: Request) {
  try {
    if (!await requireAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id, action, duration } = await req.json();
    if (!id || !['approve', 'reject', 'resolve', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    if (action === 'approve' && !hours.includes(Number(duration))) {
      return NextResponse.json({ error: 'Choose an approved duration.' }, { status: 400 });
    }

    let imagePaths: string[] = [];
    if (action === 'reject' || action === 'delete') {
      const { data: images } = await adminDb.from('options').select('image_url').eq('topic_id', id);
      imagePaths = (images || []).map((row) => optionImagePathFromUrl(row.image_url)).filter((path): path is string => !!path);
    }
    const { error } = await adminDb.rpc('admin_moderate_topic', {
      p_topic: id,
      p_action: action,
      p_duration_hours: action === 'approve' ? Number(duration) : null,
    });
    if (error) throw error;
    await removeOptionImages(imagePaths);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Admin action failed' }, { status: 400 });
  }
}

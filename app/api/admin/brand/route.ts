import { NextResponse } from 'next/server';
import { adminDb, requireAdminRequest } from '@/lib/server';
import { removeBrandLogo } from '@/lib/brand-storage';

export async function POST(req: Request) {
  try {
    if (!await requireAdminRequest(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await req.json();
    if (typeof id !== 'string' || !id) {
      return NextResponse.json({ error: 'Brand is required.' }, { status: 400 });
    }

    const { data: brand, error: lookupError } = await adminDb
      .from('brand_cards')
      .select('id,logo_url')
      .eq('id', id)
      .eq('status', 'active')
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!brand) return NextResponse.json({ error: 'Active brand not found.' }, { status: 404 });

    // This RPC permanently deletes the row, cascades its votes, and compacts positions.
    const { error: deleteError } = await adminDb.rpc('delete_active_brand', { p_brand: id });
    if (deleteError) throw deleteError;

    const logoRemoved = await removeBrandLogo(brand.logo_url);
    return NextResponse.json({
      ok: true,
      ...(logoRemoved ? {} : { warning: 'Brand deleted, but its logo could not be removed from storage.' }),
    });
  } catch (error) {
    console.error('Brand deletion failed:', error);
    return NextResponse.json({ error: 'Could not delete brand. Please try again.' }, { status: 500 });
  }
}

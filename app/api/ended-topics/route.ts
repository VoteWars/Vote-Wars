import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await adminDb
      .from('topics')
      .select('id,title,total_votes,resolved_at')
      .eq('status', 'resolved')
      .order('resolved_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ topics: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch ended battles' }, { status: 500 });
  }
}

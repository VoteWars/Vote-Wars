import { NextResponse } from 'next/server';
import { adminDb, requireViewer } from '@/lib/server';

export async function GET(req: Request) {
  const user = await requireViewer(req);
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { data, error } = await adminDb
    .from('profiles')
    .select('email,total_votes_cast,total_topics_created,total_options_created,total_winning_options')
    .eq('id', user.id)
    .single();
  if (error) return NextResponse.json({ error: 'Could not load profile.' }, { status: 500 });
  return NextResponse.json(data);
}

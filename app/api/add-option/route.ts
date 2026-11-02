import { NextResponse } from 'next/server';
import { adminDb, requireViewer } from '@/lib/server';

export async function POST(req: Request) {
  try {
    const user = await requireViewer(req);
    if (!user) {
      return NextResponse.json({ error: 'Sign in to add an option.' }, { status: 401 });
    }

    const body = await req.json();
    const topicId = typeof body.topicId === 'string' ? body.topicId : '';
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!topicId || !text || text.length > 100) {
      return NextResponse.json({ error: 'Enter an option of 1–100 characters.' }, { status: 400 });
    }

    const { data: topic, error: topicError } = await adminDb
      .from('topics')
      .select('id,status')
      .eq('id', topicId)
      .maybeSingle();
    if (topicError) throw topicError;
    if (!topic || topic.status !== 'active') {
      return NextResponse.json({ error: 'Options can only be added to active topics.' }, { status: 400 });
    }

    const { count, error: countError } = await adminDb
      .from('options')
      .select('id', { count: 'exact', head: true })
      .eq('topic_id', topicId);
    if (countError) throw countError;
    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: 'This topic is full. Max 5 options.' }, { status: 400 });
    }

    const { error: insertError } = await adminDb
      .from('options')
      .insert({ topic_id: topicId, text, created_by: user.id });
    if (insertError) throw insertError;

    const { error: statError } = await adminDb.rpc('increment_profile_stat', {
      p_user: user.id,
      p_column: 'total_options_created',
    });
    if (statError) console.error('Could not update option creation stat:', statError);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Adding topic option failed:', error);
    return NextResponse.json({ error: 'Could not add option. Please try again.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { adminDb, requireViewer } from '@/lib/server';

export async function POST(req: Request) {
  try {
    const user = await requireViewer(req);
    if (!user) {
      return NextResponse.json({ error: 'Sign in to create a topic.' }, { status: 401 });
    }

    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const options: string[] = Array.isArray(body.options)
      ? body.options.map((value: unknown) => typeof value === 'string' ? value.trim() : '')
      : [];

    if (
      !title || title.length > 140 ||
      options.length < 2 || options.length > 5 ||
      options.some((option) => !option || option.length > 100)
    ) {
      return NextResponse.json(
        { error: 'Add a title (max 140 characters) and 2–5 options (max 100 characters each).' },
        { status: 400 }
      );
    }

    const { data: topic, error: topicError } = await adminDb
      .from('topics')
      .insert({ title, status: 'pending', created_by: user.id })
      .select('id')
      .single();
    if (topicError) throw topicError;

    const { error: optionError } = await adminDb.from('options').insert(
      options.map((text) => ({ topic_id: topic.id, text, created_by: user.id }))
    );
    if (optionError) {
      const { error: cleanupError } = await adminDb.from('topics').delete().eq('id', topic.id);
      if (cleanupError) console.error('Could not clean up incomplete topic:', cleanupError);
      throw optionError;
    }

    const [{ error: topicStatError }, { error: optionStatError }] = await Promise.all([
      adminDb.rpc('increment_profile_stat', {
        p_user: user.id,
        p_column: 'total_topics_created',
      }),
      adminDb.rpc('increment_profile_stat', {
        p_user: user.id,
        p_column: 'total_options_created',
        p_delta: options.length,
      }),
    ]);
    if (topicStatError || optionStatError) {
      console.error('Could not update topic creation stats:', topicStatError || optionStatError);
    }

    return NextResponse.json({ ok: true, id: topic.id });
  } catch (error) {
    console.error('Topic submission failed:', error);
    return NextResponse.json({ error: 'Could not submit topic. Please try again.' }, { status: 500 });
  }
}

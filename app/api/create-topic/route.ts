import { NextResponse } from 'next/server';
import { adminDb, requireViewer } from '@/lib/server';

export async function POST(req: Request) {
  try {
    const user = await requireViewer(req);
    if (!user) {
      return NextResponse.json({ error: 'Sign in to create a topic.' }, { status: 401 });
    }

    const { title, options } = await req.json();

    if (
      !title?.trim() ||
      !Array.isArray(options) ||
      options.length < 2 ||
      options.length > 5 ||
      options.some((o: string) => !o.trim())
    ) {
      return NextResponse.json(
        { error: 'Add a title and between 2 and 5 non-empty options.' },
        { status: 400 }
      );
    }

    // Insert topic without type; if legacy NOT NULL constraint is still present on DB, auto-fallback
    let topicResult = await adminDb
      .from('topics')
      .insert({
        title: title.trim(),
        status: 'pending',
        created_by: user.id,
      })
      .select('id')
      .single();

    if (topicResult.error && topicResult.error.message.includes('type')) {
      topicResult = await adminDb
        .from('topics')
        .insert({
          title: title.trim(),
          type: 'predict_it',
          status: 'pending',
          created_by: user.id,
        })
        .select('id')
        .single();
    }

    if (topicResult.error) throw topicResult.error;

    const topic = topicResult.data;

    const { error: optionError } = await adminDb.from('options').insert(
      options.map((text: string) => ({
        topic_id: topic.id,
        text: text.trim(),
        created_by: user.id,
      }))
    );

    if (optionError) throw optionError;

    await adminDb.rpc('increment_profile_stat', {
      p_user: user.id,
      p_column: 'total_topics_created',
    });
    await adminDb.rpc('increment_profile_stat', {
      p_user: user.id,
      p_column: 'total_options_created',
      p_delta: options.length,
    });

    return NextResponse.json({ ok: true, id: topic.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Could not submit topic' },
      { status: 400 }
    );
  }
}

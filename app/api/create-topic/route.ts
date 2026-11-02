import { NextResponse } from 'next/server';
import { adminDb, requireViewer } from '@/lib/server';

export async function POST(req: Request) {
  try {
    const user = await requireViewer(req);
    if (!user) {
      return NextResponse.json({ error: 'Sign in to create a topic.' }, { status: 401 });
    }

    const { title, type = 'predict_it', options } = await req.json();

    const allowedTypes = ['predict_it', 'judge_it', 'settle_this', 'rank_it'];
    const resolvedType = allowedTypes.includes(type) ? type : 'predict_it';

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

    const { data: topic, error } = await adminDb
      .from('topics')
      .insert({
        title: title.trim(),
        type: resolvedType,
        status: 'pending',
        created_by: user.id,
      })
      .select('id')
      .single();

    if (error) throw error;

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

import { NextResponse } from 'next/server';
import { adminDb, requireViewer } from '@/lib/server';
import { OptionImageInputError, removeOptionImages, uploadOptionImage } from '@/lib/option-images';

type TextOption = { type: 'text'; text: string };
type ImageOption = { type: 'image'; fileKey: string };
type SubmittedOption = TextOption | ImageOption;

export async function POST(req: Request) {
  try {
    const user = await requireViewer(req);
    if (!user) return NextResponse.json({ error: 'Sign in to create a topic.' }, { status: 401 });

    let form: FormData;
    if (req.headers.get('content-type')?.includes('application/json')) {
      const legacy = await req.json();
      form = new FormData();
      form.set('title', typeof legacy.title === 'string' ? legacy.title : '');
      form.set('options', JSON.stringify(Array.isArray(legacy.options)
        ? legacy.options.map((text: unknown) => ({ type: 'text', text: typeof text === 'string' ? text : '' }))
        : []));
    } else {
      form = await req.formData();
    }
    const title = typeof form.get('title') === 'string' ? String(form.get('title')).trim() : '';
    let options: SubmittedOption[] = [];
    try {
      const rawOptions = form.get('options');
      if (typeof rawOptions === 'string') options = JSON.parse(rawOptions);
    } catch {
      return NextResponse.json({ error: 'Invalid topic options.' }, { status: 400 });
    }

    if (!title || title.length > 140 || !Array.isArray(options) || options.length < 2 || options.length > 5) {
      return NextResponse.json({ error: 'Add a title (max 140 characters) and 2–5 options.' }, { status: 400 });
    }
    for (let index = 0; index < options.length; index++) {
      const option = options[index] as SubmittedOption;
      if (!option || typeof option !== 'object') {
        return NextResponse.json({ error: 'Each option must be text or an image.' }, { status: 400 });
      }
      if (option.type === 'text') {
        if (typeof option.text !== 'string' || !option.text.trim() || option.text.trim().length > 100) {
          return NextResponse.json({ error: 'Text options must contain 1–100 characters.' }, { status: 400 });
        }
      } else if (option.type === 'image') {
        if (option.fileKey !== `option_image_${index}` || !form.get(option.fileKey)) {
          return NextResponse.json({ error: 'Choose and crop an image for every image option.' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'Each option must be text or an image.' }, { status: 400 });
      }
    }

    const { data: topic, error: topicError } = await adminDb
      .from('topics')
      .insert({ title, status: 'pending', created_by: user.id })
      .select('id')
      .single();
    if (topicError) throw topicError;

    const uploadedPaths: string[] = [];
    try {
      const rows = [];
      for (let index = 0; index < options.length; index++) {
        const option = options[index];
        if (option.type === 'text') {
          rows.push({ topic_id: topic.id, text: option.text.trim(), image_url: null, created_by: user.id });
        } else {
          const image = await uploadOptionImage(topic.id, form.get(option.fileKey));
          uploadedPaths.push(image.path);
          rows.push({ topic_id: topic.id, text: null, image_url: image.url, created_by: user.id });
        }
      }

      const { error: optionError } = await adminDb.from('options').insert(rows);
      if (optionError) throw optionError;
    } catch (error) {
      await removeOptionImages(uploadedPaths);
      const { error: cleanupError } = await adminDb.from('topics').delete().eq('id', topic.id);
      if (cleanupError) console.error('Could not clean up incomplete topic:', cleanupError);
      throw error;
    }

    const [{ error: topicStatError }, { error: optionStatError }] = await Promise.all([
      adminDb.rpc('increment_profile_stat', { p_user: user.id, p_column: 'total_topics_created' }),
      adminDb.rpc('increment_profile_stat', { p_user: user.id, p_column: 'total_options_created', p_delta: options.length }),
    ]);
    if (topicStatError || optionStatError) console.error('Could not update topic creation stats:', topicStatError || optionStatError);

    return NextResponse.json({ ok: true, id: topic.id });
  } catch (error) {
    if (error instanceof OptionImageInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('Topic submission failed:', error);
    return NextResponse.json({ error: 'Could not submit topic. Please try again.' }, { status: 500 });
  }
}

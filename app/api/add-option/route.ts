import { NextResponse } from 'next/server';
import { adminDb, requireViewer } from '@/lib/server';
import { OptionImageInputError, removeOptionImages, uploadOptionImage } from '@/lib/option-images';

export async function POST(req: Request) {
  try {
    const user = await requireViewer(req);
    if (!user) return NextResponse.json({ error: 'Sign in to add an option.' }, { status: 401 });

    let form: FormData;
    if (req.headers.get('content-type')?.includes('application/json')) {
      const legacy = await req.json();
      form = new FormData();
      form.set('topicId', typeof legacy.topicId === 'string' ? legacy.topicId : '');
      form.set('option', JSON.stringify({ type: 'text', text: typeof legacy.text === 'string' ? legacy.text : '' }));
    } else {
      form = await req.formData();
    }
    const topicId = typeof form.get('topicId') === 'string' ? String(form.get('topicId')) : '';
    let option: { type: 'text'; text: string } | { type: 'image'; fileKey: string } | null = null;
    try {
      const raw = form.get('option');
      if (typeof raw === 'string') option = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid option.' }, { status: 400 });
    }
    if (!topicId || !option || (option.type === 'text'
      ? typeof option.text !== 'string' || !option.text.trim() || option.text.trim().length > 100
      : option.type !== 'image' || option.fileKey !== 'option_image' || !form.get(option.fileKey))) {
      return NextResponse.json({ error: 'Enter 1–100 characters or choose a cropped image.' }, { status: 400 });
    }

    const { data: topic, error: topicError } = await adminDb.from('topics')
      .select('id,status').eq('id', topicId).maybeSingle();
    if (topicError) throw topicError;
    if (!topic || topic.status !== 'active') {
      return NextResponse.json({ error: 'Options can only be added to active topics.' }, { status: 400 });
    }

    const { count, error: countError } = await adminDb.from('options')
      .select('id', { count: 'exact', head: true }).eq('topic_id', topicId);
    if (countError) throw countError;
    if ((count ?? 0) >= 5) return NextResponse.json({ error: 'This topic is full. Max 5 options.' }, { status: 400 });

    let uploadedPath: string | null = null;
    let row: { topic_id: string; text: string | null; image_url: string | null; created_by: string };
    if (option.type === 'text') {
      row = { topic_id: topicId, text: option.text.trim(), image_url: null, created_by: user.id };
    } else {
      const image = await uploadOptionImage(topicId, form.get(option.fileKey));
      uploadedPath = image.path;
      row = { topic_id: topicId, text: null, image_url: image.url, created_by: user.id };
    }

    const { error: insertError } = await adminDb.from('options').insert(row);
    if (insertError) {
      if (uploadedPath) await removeOptionImages([uploadedPath]);
      throw insertError;
    }

    const { error: statError } = await adminDb.rpc('increment_profile_stat', {
      p_user: user.id, p_column: 'total_options_created',
    });
    if (statError) console.error('Could not update option creation stat:', statError);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OptionImageInputError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('Adding topic option failed:', error);
    return NextResponse.json({ error: 'Could not add option. Please try again.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { adminDb, limited } from '@/lib/server';
import { getFingerprint } from '@/lib/fingerprint';
import { optionImagePathFromUrl, removeOptionImages } from '@/lib/option-images';

export async function POST(req: Request) {
  try {
    const fingerprint = getFingerprint(req);
    if (!await limited(fingerprint, 'delete-vote')) return NextResponse.json({ error: 'Too many requests. Try again in a minute.' }, { status: 429 });
    const { topicId, optionId } = await req.json();
    const { data: option } = await adminDb.from('options').select('image_url').eq('id', optionId).eq('topic_id', topicId).maybeSingle();
    const { data, error } = await adminDb.rpc('cast_option_delete_vote', { p_topic: topicId, p_option: optionId, p_fingerprint: fingerprint });
    if (error) throw error;
    if (data?.removed && option?.image_url) {
      const path = optionImagePathFromUrl(option.image_url);
      if (path) await removeOptionImages([path]);
    }
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not cast delete vote' }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/server';

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const name = String(form.get('name') || '').trim();
    const tagline = String(form.get('tagline') || '').trim();
    const contact = String(form.get('contact') || '').trim();
    const message = String(form.get('message') || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Brand name is required.' }, { status: 400 });
    }
    if (name.length > 100 || tagline.length > 140 || contact.length > 320 || message.length > 2000) {
      return NextResponse.json({ error: 'One or more fields exceed the allowed length.' }, { status: 400 });
    }

    const logoEntry = form.get('logo');
    let logoUrl: string | null = null;

    // FormData values are strings or Blobs. Avoid `instanceof File`: File is not
    // exposed as a global in every Node 18 runtime used by Netlify.
    if (logoEntry && typeof logoEntry !== 'string' && logoEntry.size > 0) {
      if (logoEntry.size > MAX_LOGO_SIZE) {
        return NextResponse.json({ error: 'Logo must be an image under 5MB.' }, { status: 400 });
      }
      const contentType = logoEntry.type.toLowerCase();
      const extension = EXTENSIONS[contentType];
      if (!extension) {
        return NextResponse.json({ error: 'Logo must be a PNG, JPEG, WebP, or SVG image.' }, { status: 400 });
      }

      const path = `applications/${crypto.randomUUID()}.${extension}`;
      const { error } = await adminDb.storage
        .from('brand-logos')
        .upload(path, await logoEntry.arrayBuffer(), { contentType, upsert: false });
      if (error) throw error;
      logoUrl = adminDb.storage.from('brand-logos').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await adminDb.from('brand_applications').insert({
      name,
      tagline: tagline || null,
      logo_url: logoUrl,
      contact: contact || null,
      message: message || null,
      status: 'pending',
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Brand application submission failed:', error);
    return NextResponse.json({ error: 'Could not submit application. Please try again.' }, { status: 500 });
  }
}

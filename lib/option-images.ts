import { adminDb } from '@/lib/server';

export const OPTION_IMAGE_BUCKET = 'topic-option-images';
export const MAX_OPTION_IMAGE_BYTES = 5 * 1024 * 1024;

export class OptionImageInputError extends Error {}

const imageTypes = {
  'image/jpeg': { extension: 'jpg', signature: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  'image/png': { extension: 'png', signature: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 },
  'image/webp': { extension: 'webp', signature: (bytes: Uint8Array) => bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 },
} as const;

export async function uploadOptionImage(topicId: string, file: FormDataEntryValue | null) {
  if (!file || typeof file === 'string' || file.size < 1 || file.size > MAX_OPTION_IMAGE_BYTES) {
    throw new OptionImageInputError('Image options must be cropped images smaller than 5 MB.');
  }
  const type = file.type as keyof typeof imageTypes;
  const format = imageTypes[type];
  if (!format) throw new OptionImageInputError('Image must be a JPG, PNG, or WebP file.');

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!format.signature(bytes)) throw new OptionImageInputError('The image file does not match its file type.');

  const path = `${topicId}/${crypto.randomUUID()}.${format.extension}`;
  const { error } = await adminDb.storage.from(OPTION_IMAGE_BUCKET).upload(path, bytes, {
    contentType: type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;

  const { data } = adminDb.storage.from(OPTION_IMAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeOptionImages(paths: string[]) {
  if (!paths.length) return;
  const { error } = await adminDb.storage.from(OPTION_IMAGE_BUCKET).remove(paths);
  if (error) console.error('Could not remove topic option images:', error);
}

export function optionImagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${OPTION_IMAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index < 0) return null;
  try {
    return decodeURIComponent(url.slice(index + marker.length));
  } catch {
    return null;
  }
}

import 'server-only';
import { adminDb } from '@/lib/server';

const BUCKET = 'brand-logos';

/** Remove a logo only when its URL points at our own public storage bucket. */
export async function removeBrandLogo(url: string | null | undefined): Promise<boolean> {
  if (!url) return true;

  try {
    const parsed = new URL(url);
    const prefix = `/storage/v1/object/public/${BUCKET}/`;
    if (!parsed.pathname.startsWith(prefix)) return true;

    const objectPath = decodeURIComponent(parsed.pathname.slice(prefix.length));
    if (!objectPath) return true;

    const { error } = await adminDb.storage.from(BUCKET).remove([objectPath]);
    if (error) {
      console.error('Could not remove brand logo from storage:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Could not parse or remove brand logo:', error);
    return false;
  }
}

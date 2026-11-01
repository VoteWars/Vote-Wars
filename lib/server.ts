import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const adminDb: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceKey || 'placeholder-key',
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
    },
  }
);

export function getSupabaseEnvDiagnostics() {
  return {
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    usingAnonFallback:
      !process.env.SUPABASE_SERVICE_ROLE_KEY && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export async function getViewer(token?: string) {
  if (!token) return null;
  const { data, error } = await adminDb.auth.getUser(token);
  return error ? null : data.user;
}

export async function requireViewer(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return getViewer(token);
}

export async function requireAdminRequest(request: Request) {
  const user = await requireViewer(request);
  return !!user &&
    !!process.env.ADMIN_EMAIL &&
    user.email?.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()
    ? user
    : null;
}

export async function limited(fingerprint: string, endpoint: string) {
  const { data, error } = await adminDb.rpc('consume_rate_limit', {
    p_fingerprint: fingerprint,
    p_endpoint: endpoint,
  });
  if (error) throw error;
  return Number(data) <= 20;
}

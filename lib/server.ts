import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = 'https://ujbwptbwwzwcnnwaswby.supabase.co';
const defaultAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYndwdGJ3d3p3Y25ud2Fzd2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MjUyOTAsImV4cCI6MjEwOTEwMTI5MH0.cTgGcOuFY5zgctMnfYwxoT-k2ZY5f2qHtozlJYqoOrs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  defaultAnonKey;

export const adminDb: SupabaseClient = createClient(
  supabaseUrl,
  serviceKey,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
    },
  }
);

export function getSupabaseEnvDiagnostics() {
  return {
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl),
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultAnonKey),
    usingAnonFallback: !process.env.SUPABASE_SERVICE_ROLE_KEY,
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
  const adminEmail = process.env.ADMIN_EMAIL;
  return !!user &&
    !!adminEmail &&
    user.email?.toLowerCase() === adminEmail.toLowerCase()
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

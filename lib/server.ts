import 'server-only'
import { createClient } from '@supabase/supabase-js'
export const adminDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
export async function getViewer(token?: string) {
  if (!token) return null
  const { data, error } = await adminDb.auth.getUser(token)
  return error ? null : data.user
}
export async function requireViewer(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i,'')
  return getViewer(token)
}
export async function requireAdminRequest(request: Request) {
  const user=await requireViewer(request)
  return !!user && !!process.env.ADMIN_EMAIL && user.email?.toLowerCase()===process.env.ADMIN_EMAIL.toLowerCase() ? user : null
}
export async function limited(fingerprint: string, endpoint: string) {
  const { data, error } = await adminDb.rpc('consume_rate_limit',{p_fingerprint:fingerprint,p_endpoint:endpoint})
  if(error) throw error
  return Number(data) <= 20
}

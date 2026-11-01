import { createHash } from 'crypto'
export function getFingerprint(request: Request): string {
  const h=request.headers
  const ip=h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  return createHash('sha256').update(ip+(h.get('user-agent')||'unknown')).digest('hex')
}

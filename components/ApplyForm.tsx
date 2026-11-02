'use client'
import { useState } from 'react'

export default function ApplyForm() {
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/apply', {
        method: 'POST',
        body: new FormData(event.currentTarget),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Could not submit application. Please try again.')
        return
      }
      setDone(true)
    } catch {
      setError('Unable to send your application right now. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) return <div className="glass-card empty-state">Application received. We’ll be in touch.</div>

  return (
    <form className="glass-card form-card" onSubmit={submit}>
      <div className="field"><label>Brand name</label><input className="input" name="name" maxLength={100} required /></div>
      <div className="field"><label>Tagline</label><input className="input" name="tagline" maxLength={140} placeholder="Your one-line pitch" /></div>
      <div className="field"><label>Logo</label><input className="input" name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" /></div>
      <div className="field"><label>Contact email</label><input className="input" name="contact" type="email" maxLength={320} required /></div>
      <div className="field"><label>Message</label><textarea className="textarea" name="message" maxLength={2000} placeholder="Tell us about your brand" /></div>
      <button className="glass-button primary-button wide" disabled={busy}>{busy ? 'Sending…' : 'Send application'}</button>
      {error && <div className="hint" role="alert">{error}</div>}
    </form>
  )
}

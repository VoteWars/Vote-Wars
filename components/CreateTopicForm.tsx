'use client'

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateTopicForm() {
  const { session, ready } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  if (ready && !session) {
    return (
      <div className="glass-card empty-state">
        Sign in to create a topic.{' '}
        <Link className="brand-yellow" href="/login">
          Sign in →
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    setMsg('');

    const r = await fetch('/api/create-topic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        title,
        type: 'predict_it',
        options,
      }),
    });

    const j = await r.json();
    setBusy(false);

    if (!r.ok) {
      setMsg(j.error || 'Failed to submit topic');
      return;
    }

    setMsg('Submitted for review! Redirecting…');
    setTitle('');
    setOptions(['', '']);
    setTimeout(() => router.push('/'), 1600);
  }

  return (
    <form className="glass-card form-card" onSubmit={submit}>
      <div className="field">
        <label htmlFor="title">Topic title</label>
        <input
          id="title"
          className="input"
          maxLength={140}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Settle the debate…"
        />
      </div>

      <div className="field">
        <label>
          Options <span className="hint">(2–5 options)</span>
        </label>
        {options.map((o, i) => (
          <div className="form-row" key={i}>
            <input
              aria-label={`Option ${i + 1}`}
              className="input"
              required
              maxLength={100}
              value={o}
              onChange={(e) =>
                setOptions((a) => a.map((x, k) => (k === i ? e.target.value : x)))
              }
              placeholder={`Option ${i + 1}`}
            />
            {options.length > 2 && (
              <button
                type="button"
                className="glass-button"
                style={{ padding: '0 14px' }}
                onClick={() => setOptions((a) => a.filter((_, k) => k !== i))}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {options.length < 5 && (
          <button
            type="button"
            className="glass-button"
            style={{ padding: '9px 15px', alignSelf: 'flex-start', marginTop: 4 }}
            onClick={() => setOptions((a) => [...a, ''])}
          >
            + Add option
          </button>
        )}
      </div>

      <button className="glass-button primary-button wide" disabled={busy}>
        {busy ? 'Submitting…' : 'Submit battle'}
      </button>

      {msg && <div className="notice glass-card">{msg}</div>}
    </form>
  );
}

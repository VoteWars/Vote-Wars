'use client'

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { session } = useAuth();

  if (session) {
    return (
      <div className="glass-card empty-state">
        You’re signed in.{' '}
        <button className="glass-button primary-button" onClick={() => router.push('/')}>
          Go to battles
        </button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');

    const result =
      mode === 'in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setBusy(false);

    if (result.error) {
      setMsg(result.error.message);
      return;
    }

    if (mode === 'up') {
      setMsg(
        'Account created! You will receive a confirmation email from Supabase Auth. Please check your inbox and spam folder to verify your account.'
      );
      return;
    }

    router.push('/');
  }

  return (
    <>
      <div className="brand-heading">
        <h1>{mode === 'in' ? 'WELCOME BACK' : 'JOIN THE ARENA'}</h1>
        <p>Email and password only.</p>
      </div>

      <form className="glass-card form-card" onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            className="input"
            type="password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="glass-button primary-button wide" disabled={busy}>
          {busy ? 'Working…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>

        {msg && <div className="notice glass-card">{msg}</div>}

        <p className="hint" style={{ textAlign: 'center' }}>
          {mode === 'in' ? 'New here? ' : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'in' ? 'up' : 'in');
              setMsg('');
            }}
            className="brand-yellow"
            style={{ background: 'none', border: 0, cursor: 'pointer', fontWeight: 700 }}
          >
            {mode === 'in' ? 'Create an account' : 'Sign in'}
          </button>
        </p>

        {mode === 'up' && (
          <div
            className="glass-card"
            style={{
              padding: '12px 14px',
              fontSize: '12px',
              lineHeight: 1.5,
              color: '#d6c680',
              background: 'rgba(249, 214, 1, 0.05)',
              borderColor: 'rgba(249, 214, 1, 0.2)',
            }}
          >
            📧 <strong>Note:</strong> When you sign up, you will receive an email from <strong>Supabase Auth</strong> to confirm your email address.
          </div>
        )}
      </form>
    </>
  );
}

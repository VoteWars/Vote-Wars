'use client'

import { Suspense, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

function LoginForm() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMsg('');
    setErrorMessage('');

    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMessage(error.message);
          return;
        }
        router.push('/');
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      if (!data.session) {
        setMsg('That email may already have an account. Try signing in instead.');
        return;
      }

      setMsg('You’re in! Taking you to the battles…');
      router.push('/');
    } catch {
      setErrorMessage('Could not reach the sign-in service. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="brand-heading">
        <h1>{mode === 'in' ? 'WELCOME BACK' : 'JOIN THE ARENA'}</h1>
        <p>Email and password. Voting stays open to everyone.</p>
      </div>

      <form className="glass-card form-card" onSubmit={submit}>
        {errorMessage && (
          <div
            className="glass-card"
            role="alert"
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 45, 64, 0.12)',
              borderColor: 'rgba(255, 45, 64, 0.35)',
              color: '#ff8894',
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="input"
            type="password"
            minLength={6}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button className="glass-button primary-button wide" disabled={busy}>
          {busy ? 'Working…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>

        {msg && <div className="notice glass-card" role="status">{msg}</div>}

        <p className="hint" style={{ textAlign: 'center', margin: 0 }}>
          {mode === 'in' ? 'New here? ' : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'in' ? 'up' : 'in');
              setMsg('');
              setErrorMessage('');
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
            ⚔️ <strong>No email verification needed.</strong> Create your account and jump straight into the arena.
          </div>
        )}
      </form>
    </>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="glass-card empty-state">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}

'use client'

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

function LoginForm() {
  const [mode, setMode] = useState<'in' | 'up' | 'resend'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setErrorMessage(errorParam);
    }
  }, [searchParams]);

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

  // Get current origin dynamically: window.location.origin in the browser ensures the deployed origin is used
  const getCallbackUrl = () => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return `${window.location.origin}/auth/callback`;
    }
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'https://votewars.netlify.app'}/auth/callback`;
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    setErrorMessage('');

    if (mode === 'resend') {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: getCallbackUrl(),
        },
      });
      setBusy(false);
      if (error) {
        setErrorMessage(error.message);
      } else {
        setMsg(
          'Fresh confirmation email sent! Please check your inbox and spam folder, then tap the new link.'
        );
      }
      return;
    }

    if (mode === 'in') {
      const result = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (result.error) {
        setErrorMessage(result.error.message);
        return;
      }
      router.push('/');
    } else {
      const callbackUrl = getCallbackUrl();
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });
      setBusy(false);
      if (result.error) {
        setErrorMessage(result.error.message);
        return;
      }
      setMsg(
        'Account created! You will receive a confirmation email from Supabase Auth. Please check your inbox and spam folder to verify your account.'
      );
    }
  }

  return (
    <>
      <div className="brand-heading">
        <h1>
          {mode === 'in'
            ? 'WELCOME BACK'
            : mode === 'up'
            ? 'JOIN THE ARENA'
            : 'RESEND CONFIRMATION'}
        </h1>
        <p>
          {mode === 'resend'
            ? 'Enter your email to receive a fresh verification link.'
            : 'Email and password only.'}
        </p>
      </div>

      <form className="glass-card form-card" onSubmit={submit}>
        {errorMessage && (
          <div
            className="glass-card"
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
            {mode !== 'resend' && (
              <div style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode('resend');
                    setErrorMessage('');
                    setMsg('');
                  }}
                  className="brand-yellow"
                  style={{
                    background: 'none',
                    border: 0,
                    cursor: 'pointer',
                    fontWeight: 700,
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Request a fresh confirmation email →
                </button>
              </div>
            )}
          </div>
        )}

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

        {mode !== 'resend' && (
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
        )}

        <button className="glass-button primary-button wide" disabled={busy}>
          {busy
            ? 'Working…'
            : mode === 'in'
            ? 'Sign in'
            : mode === 'up'
            ? 'Create account'
            : 'Send new confirmation email'}
        </button>

        {msg && <div className="notice glass-card">{msg}</div>}

        <div
          className="hint"
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <p style={{ margin: 0 }}>
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

          {mode !== 'resend' && (
            <p style={{ margin: 0 }}>
              <button
                type="button"
                onClick={() => {
                  setMode('resend');
                  setMsg('');
                  setErrorMessage('');
                }}
                className="muted"
                style={{
                  background: 'none',
                  border: 0,
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline',
                }}
              >
                Expired or invalid confirmation link? Resend email
              </button>
            </p>
          )}

          {mode === 'resend' && (
            <p style={{ margin: 0 }}>
              <button
                type="button"
                onClick={() => {
                  setMode('in');
                  setMsg('');
                  setErrorMessage('');
                }}
                className="brand-yellow"
                style={{ background: 'none', border: 0, cursor: 'pointer', fontWeight: 700 }}
              >
                ← Back to Sign in
              </button>
            </p>
          )}
        </div>

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
            📧 <strong>Note:</strong> When you sign up, you will receive an email from{' '}
            <strong>Supabase Auth</strong> with a secure link to confirm your email address.
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

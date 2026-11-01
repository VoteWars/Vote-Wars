'use client'

import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import Link from 'next/link';

type P = {
  email: string;
  predict_it_attempts: number;
  predict_it_correct: number;
  total_votes_cast: number;
  total_topics_created: number;
  total_options_created: number;
  total_winning_options: number;
};

export default function ProfileView() {
  const { session, ready } = useAuth();
  const [p, setP] = useState<P | null>(null);

  useEffect(() => {
    if (session) {
      fetch('/api/profile', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (!d.error) setP(d);
        });
    }
  }, [session]);

  if (!ready) {
    return <div className="glass-card empty-state">Loading your profile…</div>;
  }

  if (!session) {
    return (
      <div className="glass-card" style={{ padding: '28px 24px', textAlign: 'center' }}>
        <h1 className="page-title" style={{ fontSize: '24px', marginBottom: '8px' }}>
          Your Profile
        </h1>
        <p className="muted" style={{ fontSize: '14px', marginBottom: '20px' }}>
          Sign in to track your prediction accuracy, voting history, and battles.
        </p>
        <Link
          className="glass-button primary-button"
          style={{ display: 'inline-block', padding: '10px 26px', fontWeight: 700 }}
          href="/login"
        >
          Sign in or Create Account →
        </Link>
        <div
          className="glass-card"
          style={{
            marginTop: '24px',
            padding: '14px 18px',
            background: 'rgba(249, 214, 1, 0.07)',
            borderColor: 'rgba(249, 214, 1, 0.28)',
            color: '#F9D601',
            fontSize: '13px',
            lineHeight: 1.5,
            textAlign: 'left',
          }}
        >
          📧 <strong>Notice for new users:</strong> When you sign up, you will receive a confirmation email from <strong>Supabase Auth</strong> to verify your account. Please check your inbox and spam folder.
        </div>
      </div>
    );
  }

  if (!p) {
    return <div className="glass-card empty-state">Loading your stats…</div>;
  }

  const attempts = p.predict_it_attempts || 0;
  const accuracy = attempts ? Math.round((p.predict_it_correct / attempts) * 100) : 0;
  const color = accuracy > 60 ? '#00C853' : accuracy >= 40 ? '#F9D601' : '#FF2D40';
  const isNewUser = p.total_votes_cast === 0 && p.total_topics_created === 0;

  return (
    <>
      <h1 className="page-title">Your profile</h1>
      <p className="muted">{p.email}</p>

      {isNewUser && (
        <div
          className="glass-card"
          style={{
            padding: '13px 16px',
            margin: '16px 0',
            background: 'rgba(249, 214, 1, 0.06)',
            borderColor: 'rgba(249, 214, 1, 0.22)',
            color: '#e2d391',
            fontSize: '13px',
            lineHeight: 1.5,
          }}
        >
          📧 <strong>Notice:</strong> When you create an account, you will receive an email from <strong>Supabase Auth</strong> to confirm and protect your account.
        </div>
      )}

      {attempts > 0 && (
        <section className="profile-top">
          <div
            className="accuracy-ring"
            style={{ '--ring': color } as React.CSSProperties}
          >
            <strong>{accuracy}%</strong>
          </div>
          <div>
            <h2 style={{ margin: '0 0 5px' }}>Prediction accuracy</h2>
            <p className="muted" style={{ margin: 0 }}>
              {p.predict_it_correct} correct out of {attempts}
            </p>
          </div>
        </section>
      )}

      <div className="stat-grid" style={{ marginTop: 24 }}>
        {[
          ['Votes cast', p.total_votes_cast],
          ['Topics created', p.total_topics_created],
          ['Options created', p.total_options_created],
          ['Winning options', p.total_winning_options],
        ].map(([label, value]) => (
          <div className="glass-card stat-card" key={String(label)}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

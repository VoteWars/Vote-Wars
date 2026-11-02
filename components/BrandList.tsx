'use client'

import { useEffect, useState } from 'react';

type Brand = {
  id: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  cook_votes: number;
  roast_votes: number;
};

export default function BrandList({ brands }: { brands: Brand[] }) {
  const [items, setItems] = useState(brands);
  const [voted, setVoted] = useState<string[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    try {
      setVoted(JSON.parse(localStorage.getItem('votewars-brand-votes') || '[]'));
    } catch {}
  }, []);

  async function vote(b: Brand, choice: string) {
    if (voted.includes(b.id)) return;
    setMsg('');

    // --- INSTANT OPTIMISTIC FEEDBACK ---
    const prevItems = [...items];
    const prevVoted = [...voted];

    // Mark as voted immediately
    const nextVoted = Array.from(new Set([...voted, b.id]));
    setVoted(nextVoted);
    try {
      localStorage.setItem('votewars-brand-votes', JSON.stringify(nextVoted));
    } catch {}

    // Update counts immediately
    setItems((rows) =>
      rows.map((x) =>
        x.id === b.id
          ? {
              ...x,
              cook_votes: x.cook_votes + (choice === 'cook' ? 1 : 0),
              roast_votes: x.roast_votes + (choice === 'roast' ? 1 : 0),
            }
          : x
      )
    );

    setMsg('Vote counted! Thanks for keeping it honest.');

    try {
      const r = await fetch('/api/brand-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId: b.id, choice }),
      });
      const j = await r.json();

      if (!r.ok) {
        // Rollback on server rejection
        setItems(prevItems);
        setVoted(prevVoted);
        try {
          localStorage.setItem('votewars-brand-votes', JSON.stringify(prevVoted));
        } catch {}
        setMsg(j.error || 'Vote could not be processed.');
      }
    } catch (err: any) {
      setItems(prevItems);
      setVoted(prevVoted);
      setMsg(err?.message || 'Network error.');
    }
  }

  return (
    <>
      {items.length === 0 ? (
        <div className="glass-card empty-state">No brands are live right now.</div>
      ) : (
        items.map((b) => {
          const total = b.cook_votes + b.roast_votes;
          const pct = total ? Math.round((b.cook_votes / total) * 100) : 0;
          const isVoted = voted.includes(b.id);

          return (
            <article className="glass-card brand-card" key={b.id}>
              <span className="ad-label">Ad</span>
              <div className="brand-top">
                {b.logo_url ? (
                  <img className="brand-logo" src={b.logo_url} alt="" />
                ) : (
                  <div className="brand-logo-fallback">{b.name[0]}</div>
                )}
                <div>
                  <div className="brand-title">{b.name}</div>
                  {b.tagline && <div className="brand-tagline">{b.tagline}</div>}
                </div>
              </div>

              <div className="cook-percent">
                Cook score <strong>{pct}%</strong>{' '}
                <span style={{ fontSize: '12px', color: '#888', marginLeft: 8 }}>
                  ({total} votes)
                </span>
              </div>

              <div className="vote-actions">
                <button
                  disabled={isVoted}
                  className="glass-button cook"
                  style={{ touchAction: 'manipulation' }}
                  onClick={() => vote(b, 'cook')}
                >
                  LET THEM COOK 🔥
                </button>
                <button
                  disabled={isVoted}
                  className="glass-button roast"
                  style={{ touchAction: 'manipulation' }}
                  onClick={() => vote(b, 'roast')}
                >
                  ROAST 💀
                </button>
              </div>
            </article>
          );
        })
      )}
      {msg && (
        <p className="hint" role="status" style={{ marginTop: 14 }}>
          {msg}
        </p>
      )}
    </>
  );
}

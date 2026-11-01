'use client'

import { useState } from 'react';
import Link from 'next/link';
import Countdown from '@/components/Countdown';

export type LiveTopic = {
  id: string;
  title: string;
  total_votes: number;
  expires_at: string | null;
  recent_votes: number;
};

export type EndedTopic = {
  id: string;
  title: string;
  total_votes: number;
  resolved_at: string | null;
};

export type BrandTeaser = {
  id: string;
  name: string;
  cook_votes: number;
  roast_votes: number;
};

interface HomeFeedProps {
  initialLiveTopics: LiveTopic[];
  brands: BrandTeaser[];
  initialEndedTopics: EndedTopic[];
  feedError?: string | null;
}

export default function HomeFeed({
  initialLiveTopics,
  brands,
  initialEndedTopics,
  feedError,
}: HomeFeedProps) {
  const [tab, setTab] = useState<'live' | 'ended'>('live');
  const [endedTopics, setEndedTopics] = useState<EndedTopic[]>(initialEndedTopics);
  const [loadingEnded, setLoadingEnded] = useState(false);
  const [endedError, setEndedError] = useState<string | null>(null);

  async function handleTabChange(nextTab: 'live' | 'ended') {
    setTab(nextTab);
    if (nextTab === 'ended') {
      try {
        setLoadingEnded(true);
        setEndedError(null);
        const res = await fetch('/api/ended-topics');
        const data = await res.json();
        if (res.ok) {
          if (Array.isArray(data.topics)) {
            setEndedTopics(data.topics);
          }
        } else {
          setEndedError(data.error || 'Failed to query ended battles');
        }
      } catch (err: any) {
        console.error('Failed to refresh ended topics:', err);
        setEndedError(err?.message || 'Network error fetching ended battles');
      } finally {
        setLoadingEnded(false);
      }
    }
  }

  return (
    <>
      <section className="feed-heading">
        <div>
          <h1 className="page-title">Pick a side.</h1>
          <p>The internet decides.</p>
        </div>
        <div className="segmented-control" role="tablist" aria-label="Battle status">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'live'}
            className={`segment-btn ${tab === 'live' ? 'active' : ''}`}
            onClick={() => handleTabChange('live')}
          >
            Live
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'ended'}
            className={`segment-btn ${tab === 'ended' ? 'active' : ''}`}
            onClick={() => handleTabChange('ended')}
          >
            Ended
          </button>
        </div>
      </section>

      {tab === 'live' ? (
        <div className="topic-list">
          {feedError && (
            <div
              className="glass-card"
              style={{
                padding: '16px 18px',
                marginBottom: '10px',
                background: 'rgba(255, 45, 64, 0.12)',
                borderColor: 'rgba(255, 45, 64, 0.35)',
                color: '#ff8894',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}>
                ⚠️ Database Connection Notice
              </div>
              <div>{feedError}</div>
            </div>
          )}

          {initialLiveTopics.length === 0 && !feedError && (
            <div className="glass-card empty-state">No active battles yet. Check back soon.</div>
          )}

          {initialLiveTopics.map((t, i) => (
            <div key={t.id}>
              <Link className="glass-card feed-topic" href={`/topic/${t.id}`}>
                <h2>{t.title}</h2>
                <div className="topic-meta">
                  <strong className="brand-yellow">{t.total_votes || 0} votes</strong>
                  <Countdown expiresAt={t.expires_at} />
                </div>
              </Link>
              {i === 2 && brands && brands.length > 0 && (
                <Link
                  href="/brands"
                  className="glass-card brand-teaser"
                  style={{ marginTop: 12, marginBottom: 0 }}
                >
                  <span className="ad-label">Ad</span>
                  <div className="teaser-title">Roast Brands</div>
                  {brands.map((b) => {
                    const n = b.cook_votes + b.roast_votes;
                    return (
                      <div className="teaser-row" key={b.id}>
                        <span>{b.name}</span>
                        <strong>{n ? Math.round((b.cook_votes / n) * 100) : 0}% cook</strong>
                      </div>
                    );
                  })}
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="topic-list">
          {endedError && (
            <div
              className="glass-card"
              style={{
                padding: '16px 18px',
                marginBottom: '10px',
                background: 'rgba(255, 45, 64, 0.12)',
                borderColor: 'rgba(255, 45, 64, 0.35)',
                color: '#ff8894',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4 }}>
                ⚠️ Database Connection Notice
              </div>
              <div>{endedError}</div>
            </div>
          )}

          {endedTopics.length === 0 && !endedError ? (
            <div className="glass-card empty-state">
              {loadingEnded ? 'Loading ended battles…' : 'No ended battles yet.'}
            </div>
          ) : (
            endedTopics.map((t) => (
              <Link className="glass-card ended-topic" href={`/results/${t.id}`} key={t.id}>
                <div className="ended-content">
                  <h2 className="ended-title">{t.title}</h2>
                  <span className="ended-affordance">View results →</span>
                </div>
                <div className="ended-meta">
                  <strong className="ended-votes">{t.total_votes || 0} votes</strong>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </>
  );
}

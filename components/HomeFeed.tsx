'use client'

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Countdown from '@/components/Countdown';
import { Search, X } from 'lucide-react';

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
  const [query, setQuery] = useState('');
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

  // Filter topics based on search query
  const cleanQuery = query.trim().toLowerCase();

  const filteredLive = useMemo(() => {
    if (!cleanQuery) return initialLiveTopics;
    return initialLiveTopics.filter((t) => t.title.toLowerCase().includes(cleanQuery));
  }, [initialLiveTopics, cleanQuery]);

  const filteredEnded = useMemo(() => {
    if (!cleanQuery) return endedTopics;
    return endedTopics.filter((t) => t.title.toLowerCase().includes(cleanQuery));
  }, [endedTopics, cleanQuery]);

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
            Live {initialLiveTopics.length > 0 && `(${initialLiveTopics.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'ended'}
            className={`segment-btn ${tab === 'ended' ? 'active' : ''}`}
            onClick={() => handleTabChange('ended')}
          >
            Ended {endedTopics.length > 0 && `(${endedTopics.length})`}
          </button>
        </div>
      </section>

      {/* Instant Search Bar */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px',
          marginBottom: 16,
          borderRadius: 14,
        }}
      >
        <Search size={18} style={{ color: '#888', flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search battles by topic or keyword…"
          style={{
            background: 'transparent',
            border: 0,
            outline: 'none',
            color: '#fff',
            width: '100%',
            fontSize: '14px',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="icon-button"
            title="Clear search"
            style={{ color: '#888', padding: 2 }}
          >
            <X size={16} />
          </button>
        )}
      </div>

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

          {initialLiveTopics.length > 0 && filteredLive.length === 0 && (
            <div className="glass-card empty-state" style={{ padding: '30px 20px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '15px' }}>
                No active battles matching &ldquo;<strong>{query}</strong>&rdquo;
              </p>
              <button
                type="button"
                className="glass-button"
                style={{ padding: '8px 18px', fontSize: '13px' }}
                onClick={() => setQuery('')}
              >
                Clear search
              </button>
            </div>
          )}

          {filteredLive.map((t, i) => (
            <div key={t.id}>
              <Link className="glass-card feed-topic" href={`/topic/${t.id}`}>
                <h2>{t.title}</h2>
                <div className="topic-meta">
                  <strong className="brand-yellow">{t.total_votes || 0} votes</strong>
                  <Countdown expiresAt={t.expires_at} />
                </div>
              </Link>
              {i === 2 && brands && brands.length > 0 && !cleanQuery && (
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
          ) : endedTopics.length > 0 && filteredEnded.length === 0 ? (
            <div className="glass-card empty-state" style={{ padding: '30px 20px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '15px' }}>
                No ended battles matching &ldquo;<strong>{query}</strong>&rdquo;
              </p>
              <button
                type="button"
                className="glass-button"
                style={{ padding: '8px 18px', fontSize: '13px' }}
                onClick={() => setQuery('')}
              >
                Clear search
              </button>
            </div>
          ) : (
            filteredEnded.map((t) => (
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

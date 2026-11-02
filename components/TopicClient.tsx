'use client'

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

type Option = {
  id: string;
  text: string;
  vote_count: number;
  delete_votes: number;
  created_at: string;
};

export default function TopicClient({
  topicId,
  initial,
  totalVotes,
  status,
}: {
  topicId: string;
  initial: Option[];
  totalVotes: number;
  status: string;
}) {
  const [opts, setOpts] = useState(initial);
  const [removing, setRemoving] = useState<string[]>([]);
  const [votes, setVotes] = useState(totalVotes);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const ch = supabase
      .channel(`topic-options-${topicId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'options', filter: `topic_id=eq.${topicId}` },
        async () => {
          const { data } = await supabase
            .from('options')
            .select('id,text,vote_count,delete_votes,created_at')
            .eq('topic_id', topicId)
            .order('vote_count', { ascending: false });
          if (data) {
            setOpts(data as Option[]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [topicId]);

  const headers = useMemo<Record<string, string>>(
    () => ({
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    }),
    [session]
  );

  async function act(url: string, body: any) {
    if (busy) return;
    setMsg('');

    // --- INSTANT OPTIMISTIC FEEDBACK ---
    const prevOpts = [...opts];
    const prevVotes = votes;

    if (url === '/api/vote') {
      // Instantly increment vote count and recalculate percentages
      setVotes((v) => v + 1);
      setOpts((curr) =>
        curr
          .map((x) => (x.id === body.optionId ? { ...x, vote_count: x.vote_count + 1 } : x))
          .sort((a, b) => b.vote_count - a.vote_count)
      );
    } else if (url === '/api/delete-vote') {
      // Instantly mark delete pressure
      setOpts((curr) =>
        curr.map((x) => (x.id === body.optionId ? { ...x, delete_votes: x.delete_votes + 1 } : x))
      );
    }

    setBusy(body.optionId || url);

    try {
      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      const j = await r.json();

      if (!r.ok) {
        // Rollback optimistic state on error
        setVotes(prevVotes);
        setOpts(prevOpts);
        throw new Error(j.error || 'Action failed');
      }

      if (url === '/api/delete-vote' && j.removed) {
        const removedVotes = prevOpts.find((x) => x.id === body.optionId)?.vote_count || 0;
        setVotes((v) => Math.max(0, v - removedVotes));
        setRemoving((v) => [...v, body.optionId]);
        setTimeout(() => {
          setOpts((o) => o.filter((x) => x.id !== body.optionId));
          setRemoving((v) => v.filter((id) => id !== body.optionId));
        }, 280);
      } else if (url === '/api/add-option') {
        setText('');
        const { data } = await supabase
          .from('options')
          .select('id,text,vote_count,delete_votes,created_at')
          .eq('topic_id', topicId)
          .order('vote_count', { ascending: false });
        if (data) setOpts(data as Option[]);
      }
    } catch (e: any) {
      setMsg(e.message || 'Something went wrong.');
    } finally {
      setBusy('');
    }
  }

  return (
    <>
      <div className="option-list">
        {opts.map((o) => {
          const pressure = votes ? o.delete_votes / votes : 0;
          const percentage = votes ? Math.round((o.vote_count / votes) * 100) : 0;

          return (
            <article
              key={o.id}
              className={`glass-card option-card ${removing.includes(o.id) ? 'removing' : ''}`}
            >
              <div className="option-line">
                <span className="option-text">{o.text}</span>
                <span className="option-count">
                  {o.vote_count} <span style={{ opacity: 0.65, fontSize: '12px' }}>({percentage}%)</span>
                </span>
              </div>

              <div className="vote-track">
                <div
                  className="vote-fill"
                  style={{
                    width: `${percentage}%`,
                    transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>

              <div className="option-actions">
                <button
                  className="glass-button primary-button"
                  style={{ touchAction: 'manipulation' }}
                  disabled={status !== 'active' || busy === o.id}
                  onClick={() => act('/api/vote', { topicId, optionId: o.id })}
                >
                  Vote
                </button>
                <button
                  className={`glass-button delete-button ${pressure >= 0.2 ? 'pressured' : ''}`}
                  style={{ touchAction: 'manipulation' }}
                  disabled={status !== 'active' || busy === o.id}
                  onClick={() => act('/api/delete-vote', { topicId, optionId: o.id })}
                >
                  Vote to remove
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {status === 'active' && opts.length < 5 && (
        <form
          className="glass-card form-card"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!session) {
              router.push('/login');
              return;
            }
            await act('/api/add-option', { topicId, text });
          }}
        >
          <div className="field">
            <label htmlFor="new-option">Add an option</label>
            <div className="form-row">
              <input
                id="new-option"
                className="input"
                maxLength={100}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What's the other side?"
              />
              <button
                className="glass-button primary-button"
                style={{ touchAction: 'manipulation' }}
                disabled={!text.trim() || !!busy}
              >
                Add
              </button>
            </div>
          </div>
        </form>
      )}

      {msg && (
        <p className="hint" role="status" style={{ marginTop: 12 }}>
          {msg}
        </p>
      )}
    </>
  );
}

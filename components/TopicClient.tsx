'use client'

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import OptionEditor, { type OptionDraft } from './OptionEditor';

type Option = {
  id: string;
  text: string | null;
  image_url: string | null;
  vote_count: number;
  delete_votes: number;
  created_at: string;
};

const emptyOption = (): OptionDraft => ({ format: 'text', text: '', image: null, previewUrl: null });
const OPTION_SELECT = 'id,text,image_url,vote_count,delete_votes,created_at';

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
  const [newOption, setNewOption] = useState<OptionDraft>(emptyOption());
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const ch = supabase
      .channel(`topic-options-${topicId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'options', filter: `topic_id=eq.${topicId}` }, async () => {
        const [{ data }, { data: topic }] = await Promise.all([
          supabase.from('options').select(OPTION_SELECT).eq('topic_id', topicId).order('vote_count', { ascending: false }),
          supabase.from('topics').select('total_votes').eq('id', topicId).maybeSingle(),
        ]);
        if (data) setOpts(data as Option[]);
        if (topic) setVotes(topic.total_votes ?? 0);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [topicId]);

  const authHeaders = useMemo<Record<string, string>>(
    () => {
      const headers: Record<string, string> = {};
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      return headers;
    },
    [session?.access_token]
  );

  async function act(url: string, body: any) {
    if (busy) return;
    setMsg('');
    const prevOpts = [...opts];
    const prevVotes = votes;
    const optionId = body instanceof FormData ? '' : body.optionId;

    if (url === '/api/vote') {
      setVotes((v) => v + 1);
      setOpts((curr) => curr.map((x) => x.id === optionId ? { ...x, vote_count: x.vote_count + 1 } : x).sort((a, b) => b.vote_count - a.vote_count));
    } else if (url === '/api/delete-vote') {
      setOpts((curr) => curr.map((x) => x.id === optionId ? { ...x, delete_votes: x.delete_votes + 1 } : x));
    }

    setBusy(optionId || url);
    try {
      const isForm = body instanceof FormData;
      const r = await fetch(url, {
        method: 'POST',
        headers: { ...authHeaders, ...(!isForm ? { 'Content-Type': 'application/json' } : {}) },
        body: isForm ? body : JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) {
        setVotes(prevVotes);
        setOpts(prevOpts);
        throw new Error(j.error || 'Action failed');
      }
      if (url === '/api/delete-vote' && j.removed) {
        const removedVotes = prevOpts.find((x) => x.id === optionId)?.vote_count || 0;
        setVotes((v) => Math.max(0, v - removedVotes));
        setRemoving((v) => [...v, optionId]);
        setTimeout(() => {
          setOpts((o) => o.filter((x) => x.id !== optionId));
          setRemoving((v) => v.filter((id) => id !== optionId));
        }, 280);
      } else if (url === '/api/add-option') {
        setNewOption(emptyOption());
        const { data } = await supabase.from('options').select(OPTION_SELECT)
          .eq('topic_id', topicId).order('vote_count', { ascending: false });
        if (data) setOpts(data as Option[]);
      }
    } catch (e: any) {
      setMsg(e.message || 'Something went wrong.');
    } finally {
      setBusy('');
    }
  }

  function prepareNewOption(): FormData {
    const form = new FormData();
    form.append('topicId', topicId);
    if (newOption.format === 'text') {
      form.append('option', JSON.stringify({ type: 'text', text: newOption.text.trim() }));
    } else if (newOption.image) {
      form.append('option', JSON.stringify({ type: 'image', fileKey: 'option_image' }));
      form.append('option_image', newOption.image, 'option-image.jpg');
    }
    return form;
  }

  return (
    <>
      <div className="option-list">
        {opts.map((o) => {
          const pressure = votes ? o.delete_votes / votes : 0;
          const percentage = votes ? Math.round((o.vote_count / votes) * 100) : 0;
          return (
            <article key={o.id} className={`glass-card option-card ${o.image_url ? 'image-option-card' : 'text-option-card'} ${removing.includes(o.id) ? 'removing' : ''}`}>
              {o.image_url ? (
                <Image className="option-vote-image" src={o.image_url} alt="Image option" width={800} height={800} unoptimized />
              ) : (
                <div className="option-line"><span className="option-text">{o.text}</span></div>
              )}
              <div className="option-line option-vote-summary">
                <span className="option-count">{o.vote_count} <span style={{ opacity: 0.65, fontSize: '12px' }}>({percentage}%)</span></span>
              </div>
              <div className="vote-track"><div className="vote-fill" style={{ width: `${percentage}%`, transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }} /></div>
              <div className="option-actions">
                <button className="glass-button primary-button" style={{ touchAction: 'manipulation' }} disabled={status !== 'active' || busy === o.id}
                  onClick={() => act('/api/vote', { topicId, optionId: o.id })}>Vote</button>
                <button className={`glass-button delete-button ${pressure >= 0.2 ? 'pressured' : ''}`} style={{ touchAction: 'manipulation' }} disabled={status !== 'active' || busy === o.id}
                  onClick={() => act('/api/delete-vote', { topicId, optionId: o.id })}>Vote to remove</button>
              </div>
            </article>
          );
        })}
      </div>

      {status === 'active' && opts.length < 5 && (
        <form className="glass-card form-card" onSubmit={async (event) => {
          event.preventDefault();
          if (!session) { router.push('/login'); return; }
          await act('/api/add-option', prepareNewOption());
        }}>
          <div className="field">
            <label>Add an option</label>
            {!session && <p className="muted">Sign in to add an option: <Link className="brand-yellow" href="/login">Sign in →</Link></p>}
            <OptionEditor value={newOption} onChange={setNewOption} />
            <button className="glass-button primary-button" style={{ touchAction: 'manipulation', alignSelf: 'flex-start' }}
              disabled={!session || !!busy || (newOption.format === 'text' ? !newOption.text.trim() : !newOption.image)}>
              Add option
            </button>
          </div>
        </form>
      )}

      {msg && <p className="hint" role="status" style={{ marginTop: 12 }}>{msg}</p>}
    </>
  );
}

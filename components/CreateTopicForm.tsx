'use client'

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import OptionEditor, { type OptionDraft } from './OptionEditor';

const emptyOption = (): OptionDraft => ({ format: 'text', text: '', image: null, previewUrl: null });

export default function CreateTopicForm() {
  const { session, ready } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<OptionDraft[]>([emptyOption(), emptyOption()]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  if (ready && !session) {
    return (
      <div className="glass-card empty-state">
        Sign in to create a topic.{' '}
        <Link className="brand-yellow" href="/login">Sign in →</Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    if (options.some((option) => option.format === 'text' ? !option.text.trim() : !option.image)) {
      setMsg('Complete each option with text or a cropped image.');
      return;
    }
    setBusy(true);
    setMsg('');

    try {
      const body = new FormData();
      body.append('title', title.trim());
      body.append('options', JSON.stringify(options.map((option, index) => {
        if (option.format === 'text') return { type: 'text', text: option.text.trim() };
        body.append(`option_image_${index}`, option.image!, `option-${index + 1}.jpg`);
        return { type: 'image', fileKey: `option_image_${index}` };
      })));

      const r = await fetch('/api/create-topic', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body,
      });
      const j = await r.json();
      if (!r.ok) {
        setMsg(j.error || 'Failed to submit topic');
        return;
      }

      setMsg('Submitted for review! Redirecting…');
      setTitle('');
      setOptions([emptyOption(), emptyOption()]);
      setTimeout(() => router.push('/'), 1600);
    } catch {
      setMsg('Unable to submit your topic right now. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  function removeOption(index: number) {
    setOptions((current) => current.filter((_, i) => i !== index));
  }

  return (
    <form className="glass-card form-card" onSubmit={submit}>
      <div className="field">
        <label htmlFor="title">Topic title</label>
        <input id="title" className="input" maxLength={140} required value={title}
          onChange={(e) => setTitle(e.target.value)} placeholder="Settle the debate…" />
      </div>

      <div className="field option-editors-field">
        <label>Options <span className="hint">(2–5 options; choose text or image for each)</span></label>
        {options.map((option, index) => (
          <div className="option-editor-row" key={index}>
            <OptionEditor index={index} value={option}
              onChange={(next) => setOptions((current) => current.map((item, i) => i === index ? next : item))} />
            {options.length > 2 && (
              <button type="button" className="glass-button remove-option-button" aria-label={`Remove option ${index + 1}`}
                onClick={() => removeOption(index)}>×</button>
            )}
          </div>
        ))}

        {options.length < 5 && (
          <button type="button" className="glass-button add-option-button"
            onClick={() => setOptions((current) => [...current, emptyOption()])}>+ Add option</button>
        )}
      </div>

      <button className="glass-button primary-button wide" disabled={busy}>
        {busy ? 'Submitting…' : 'Submit battle'}
      </button>
      {msg && <div className="notice glass-card" role="status">{msg}</div>}
    </form>
  );
}

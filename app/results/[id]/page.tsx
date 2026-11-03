import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { adminDb } from '@/lib/server';

export const dynamic = 'force-dynamic';

export default async function Results({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: topic } = await adminDb
    .from('topics')
    .select('id,title,status,total_votes,resolved_at')
    .eq('id', id)
    .single();
  if (!topic || topic.status !== 'resolved') notFound();

  const { data: options } = await adminDb
    .from('options')
    .select('id,text,image_url,vote_count')
    .eq('topic_id', topic.id)
    .order('vote_count', { ascending: false });
  const winner = options?.[0];

  return (
    <>
      <Link className="back-link" href={`/topic/${topic.id}`}>← Topic</Link>
      <div className="result-header">
        <h1 className="page-title">{topic.title}</h1>
        <p className="muted">
          Voting Ended{topic.resolved_at ? ` · ${new Date(topic.resolved_at).toLocaleString()}` : ''}
        </p>
      </div>
      <div className="option-list">
        {(options || []).map((option) => (
          <article
            className={`glass-card option-card ${option.image_url ? 'image-option-card' : 'text-option-card'} ${winner?.id === option.id ? 'winner' : ''}`}
            key={option.id}
          >
            {option.image_url ? (
              <Image className="option-vote-image" src={option.image_url} alt="Image option" width={800} height={800} unoptimized />
            ) : (
              <span className="option-text">{option.text}</span>
            )}
            <div className="option-line option-vote-summary">
              <span className="option-count">{option.vote_count} votes</span>
              {winner?.id === option.id && <strong className="brand-yellow">Winner</strong>}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

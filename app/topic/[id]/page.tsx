import { notFound } from 'next/navigation';
import Link from 'next/link';
import { adminDb } from '@/lib/server';
import TopicClient from '@/components/TopicClient';

type TopicPageProps = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

export default async function TopicPage({ params }: TopicPageProps) {
  const { id } = await params;
  const { data: topic } = await adminDb
    .from('topics')
    .select('id,title,status,total_votes,expires_at')
    .eq('id', id)
    .single();
  if (!topic || !['active', 'resolved'].includes(topic.status)) notFound();

  const { data: options } = await adminDb
    .from('options')
    .select('id,text,image_url,vote_count,delete_votes,created_at')
    .eq('topic_id', topic.id)
    .order('vote_count', { ascending: false });

  return (
    <>
      <Link className="back-link" href="/">← All battles</Link>
      <div className="glass-card" style={{ padding: 22 }}>
        <h1 className="page-title">{topic.title}</h1>
        <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>
          <span className="brand-yellow">{topic.total_votes} votes</span>
          {topic.expires_at && <> · Ends {new Date(topic.expires_at).toLocaleString()}</>}
        </div>
      </div>
      <TopicClient
        topicId={topic.id}
        initial={(options || []) as any}
        totalVotes={topic.total_votes}
        status={topic.status}
      />
      {topic.status === 'resolved' && (
        <Link
          className="glass-button primary-button"
          style={{ display: 'inline-block', padding: '10px 16px' }}
          href={`/results/${topic.id}`}
        >
          See final results
        </Link>
      )}
    </>
  );
}

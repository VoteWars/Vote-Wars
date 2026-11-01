import { adminDb } from '@/lib/server';
import HomeFeed, { LiveTopic, EndedTopic, BrandTeaser } from '@/components/HomeFeed';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const since = Date.now() - 30 * 86400000;

  const [{ data: rows }, { data: brandsData }, { data: resolvedRows }] = await Promise.all([
    adminDb
      .from('topics')
      .select('id,title,total_votes,expires_at,votes(created_at)')
      .eq('status', 'active'),
    adminDb
      .from('brand_cards')
      .select('id,name,cook_votes,roast_votes')
      .eq('status', 'active')
      .order('position', { ascending: true })
      .limit(3),
    adminDb
      .from('topics')
      .select('id,title,total_votes,resolved_at')
      .eq('status', 'resolved')
      .order('resolved_at', { ascending: false }),
  ]);

  const liveTopics = ((rows || []) as any[])
    .map(
      (t) =>
        ({
          id: t.id,
          title: t.title,
          total_votes: t.total_votes || 0,
          expires_at: t.expires_at,
          recent_votes: (t.votes || []).filter(
            (v: any) => new Date(v.created_at).getTime() > since
          ).length,
        } as LiveTopic)
    )
    .sort((a, b) => b.recent_votes - a.recent_votes);

  const brands = (brandsData || []) as BrandTeaser[];
  const endedTopics = (resolvedRows || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    total_votes: t.total_votes || 0,
    resolved_at: t.resolved_at,
  })) as EndedTopic[];

  return (
    <HomeFeed
      initialLiveTopics={liveTopics}
      brands={brands}
      initialEndedTopics={endedTopics}
    />
  );
}

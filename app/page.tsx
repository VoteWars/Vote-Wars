import { adminDb, getSupabaseEnvDiagnostics } from '@/lib/server';
import HomeFeed, { LiveTopic, EndedTopic, BrandTeaser } from '@/components/HomeFeed';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function Home() {
  const diag = getSupabaseEnvDiagnostics();
  let feedError: string | null = null;
  let liveTopics: LiveTopic[] = [];
  let brands: BrandTeaser[] = [];
  let endedTopics: EndedTopic[] = [];

  if (!diag.hasUrl) {
    console.error('[Feed Error]: NEXT_PUBLIC_SUPABASE_URL environment variable is missing.');
    feedError = 'Configuration issue: NEXT_PUBLIC_SUPABASE_URL is missing in the environment.';
  } else if (!diag.hasServiceKey && !diag.hasAnonKey) {
    console.error(
      '[Feed Error]: Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is set.'
    );
    feedError =
      'Configuration issue: Supabase API Key is missing in the server runtime environment.';
  } else {
    try {
      const since = Date.now() - 30 * 86400000;

      const [activeRes, brandsRes, resolvedRes] = await Promise.all([
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

      if (activeRes.error) {
        console.error('[Feed Active Topics Error]:', {
          message: activeRes.error.message,
          code: activeRes.error.code,
          details: activeRes.error.details,
          hint: activeRes.error.hint,
        });

        // If the query failed (e.g. relation permission on votes), try fallback query without votes
        const fallbackRes = await adminDb
          .from('topics')
          .select('id,title,total_votes,expires_at')
          .eq('status', 'active');

        if (fallbackRes.error) {
          console.error('[Feed Fallback Query Error]:', {
            message: fallbackRes.error.message,
            code: fallbackRes.error.code,
          });
          feedError = `Unable to load active battles: ${fallbackRes.error.message}`;
        } else if (fallbackRes.data) {
          liveTopics = fallbackRes.data.map((t: any) => ({
            id: t.id,
            title: t.title,
            total_votes: t.total_votes || 0,
            expires_at: t.expires_at,
            recent_votes: 0,
          }));
        }
      } else if (activeRes.data) {
        liveTopics = activeRes.data
          .map(
            (t: any) =>
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
      }

      if (brandsRes.error) {
        console.error('[Feed Brands Error]:', brandsRes.error.message);
      } else if (brandsRes.data) {
        brands = brandsRes.data as BrandTeaser[];
      }

      if (resolvedRes.error) {
        console.error('[Feed Ended Topics Error]:', resolvedRes.error.message);
        if (!feedError) feedError = `Unable to load ended battles: ${resolvedRes.error.message}`;
      } else if (resolvedRes.data) {
        endedTopics = resolvedRes.data.map((t: any) => ({
          id: t.id,
          title: t.title,
          total_votes: t.total_votes || 0,
          resolved_at: t.resolved_at,
        })) as EndedTopic[];
      }
    } catch (err: any) {
      console.error('[Feed Query Uncaught Exception]:', err?.message);
      feedError = `Database connection failed: ${err?.message || 'Unknown error'}`;
    }
  }

  return (
    <HomeFeed
      initialLiveTopics={liveTopics}
      brands={brands}
      initialEndedTopics={endedTopics}
      feedError={feedError}
    />
  );
}

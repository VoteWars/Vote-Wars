# VoteWars

Full VoteWars web app built with Next.js 14 App Router, TypeScript, Tailwind CSS, and Supabase. Includes the public feed, topics, results, topic submission, Roast Brands, applications, profiles, email/password auth, and a server-gated admin dashboard.

## Run locally
1. `npm install`
2. `.env.local` is configured for this connected Supabase project. Keep it private; never commit or share the service-role key. `ADMIN_EMAIL` is set to the configured administrator.
3. `npm run dev` then open `http://localhost:3000`.
4. `npm run build` validates the production build.

## Admin dashboard
Visit `/admin` after signing in with the configured admin email. Authorization is checked on the server for both page access and admin APIs. The dashboard includes activity metrics, pending topic and brand-application review, active topic management, and brand placement management.

## Database
The connected Supabase project has the required schema, RLS policies, triggers, server-only voting RPCs, rate-limit RPC, Realtime publication for topic options, logo bucket, and scheduled cleanup/resolution jobs. A reproducible SQL snapshot is in `supabase/migrations/202611010001_votewars_full_schema.sql`.

**Security:** `.env.local` contains a private Supabase service-role key. Keep the project archive private, do not send it to others, and do not commit it to GitHub. `.gitignore` excludes `.env.local`.

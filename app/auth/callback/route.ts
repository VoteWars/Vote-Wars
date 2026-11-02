import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const defaultUrl = 'https://ujbwptbwwzwcnnwaswby.supabase.co';
const defaultAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYndwdGJ3d3p3Y25ud2Fzd2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MjUyOTAsImV4cCI6MjEwOTEwMTI5MH0.cTgGcOuFY5zgctMnfYwxoT-k2ZY5f2qHtozlJYqoOrs';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Validate next path: allow only safe relative paths to prevent open redirects
  const nextParam = requestUrl.searchParams.get('next') ?? '/';
  const isSafeRelative =
    nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes('\\');
  const nextPath = isSafeRelative ? nextParam : '/';

  // Handle explicit errors from Supabase
  if (error || errorDescription) {
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set(
      'error',
      'The confirmation link is invalid or has expired. Please request a fresh confirmation email below.'
    );
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultAnonKey;

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Expected when called from streaming / route handler edge cases
          }
        },
      },
    });

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
    }
  }

  // Fallback failure redirect with clear guidance
  const loginUrl = new URL('/login', requestUrl.origin);
  loginUrl.searchParams.set(
    'error',
    'The confirmation link is invalid or has expired. Please sign in or request a fresh confirmation link.'
  );
  return NextResponse.redirect(loginUrl);
}

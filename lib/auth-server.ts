import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const defaultUrl = 'https://ujbwptbwwzwcnnwaswby.supabase.co';
const defaultAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYndwdGJ3d3p3Y25ud2Fzd2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MjUyOTAsImV4cCI6MjEwOTEwMTI5MH0.cTgGcOuFY5zgctMnfYwxoT-k2ZY5f2qHtozlJYqoOrs';

export async function getServerUser() {
  const store = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultAnonKey;

  const client = createServerClient(url, key, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            store.set(name, value, options)
          );
        } catch {}
      },
    },
  });

  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

export async function isAdminUser(user: { email?: string } | null) {
  const adminEmail = process.env.ADMIN_EMAIL || 'iamtheguest4234@gmail.com';
  return (
    !!user &&
    !!adminEmail &&
    user.email?.toLowerCase() === adminEmail.toLowerCase()
  );
}

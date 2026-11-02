'use client'

import { createBrowserClient } from '@supabase/ssr';

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujbwptbwwzwcnnwaswby.supabase.co';
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYndwdGJ3d3p3Y25ud2Fzd2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1MjUyOTAsImV4cCI6MjEwOTEwMTI5MH0.cTgGcOuFY5zgctMnfYwxoT-k2ZY5f2qHtozlJYqoOrs';

export const supabase = createBrowserClient(url, key);

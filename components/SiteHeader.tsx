'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';
import { LogOut, ShieldCheck, Flame } from 'lucide-react';

export default function SiteHeader() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!session?.access_token) {
      setIsAdmin(false);
      return;
    }
    fetch('/api/admin-check', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((d) => setIsAdmin(Boolean(d.admin)))
      .catch(() => setIsAdmin(false));
  }, [session?.access_token]);

  return (
    <header className="topbar">
      <Link href="/" className="wordmark">
        <img src="/logo.png" alt="VoteWars" />
      </Link>
      <div className="top-actions">
        {isAdmin && (
          <Link
            className="top-link brand-yellow"
            style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            href="/admin"
          >
            <ShieldCheck size={16} /> Admin
          </Link>
        )}
        <Link className="roast-pill-btn" href="/brands">
          <Flame size={15} className="flame-icon" />
          <span>Roast brands</span>
        </Link>
        {session ? (
          <button className="icon-button" title="Sign out" onClick={() => supabase.auth.signOut()}>
            <LogOut size={18} />
          </button>
        ) : (
          <Link className="top-link" href="/login">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

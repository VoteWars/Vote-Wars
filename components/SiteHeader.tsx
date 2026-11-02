'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase';
import { LogOut, ShieldCheck, Flame } from 'lucide-react';

export default function SiteHeader() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link href="/" className="wordmark">
          <Image src="/logo.png" alt="VoteWars" width={988} height={150} priority />
        </Link>
        <nav className="desktop-header-nav" aria-label="Desktop navigation">
          <Link href="/" className={`top-nav-link ${pathname === '/' ? 'active' : ''}`}>
            Battles
          </Link>
          <Link href="/create" className={`top-nav-link ${pathname === '/create' ? 'active' : ''}`}>
            Create
          </Link>
          <Link href="/brands" className={`top-nav-link ${pathname === '/brands' ? 'active' : ''}`}>
            Brands
          </Link>
          <Link href="/profile" className={`top-nav-link ${pathname === '/profile' ? 'active' : ''}`}>
            Profile
          </Link>
        </nav>
      </div>

      <div className="top-actions">
        {isAdmin && (
          <Link
            className="top-link brand-yellow"
            style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '12px' }}
            href="/admin"
          >
            <ShieldCheck size={14} /> Admin
          </Link>
        )}
        <Link className="roast-pill-btn" href="/brands" title="Roast brands">
          <Flame size={13} className="flame-icon" />
          <span>Roast brands</span>
        </Link>
        {session ? (
          <button className="icon-button" title="Sign out" onClick={() => supabase.auth.signOut()}>
            <LogOut size={16} />
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

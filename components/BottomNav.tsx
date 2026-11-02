'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Plus, Flame, UserRound } from 'lucide-react';

const tabs = [
  ['/', 'Home', House],
  ['/create', 'Create', Plus],
  ['/brands', 'Brands', Flame],
  ['/profile', 'Profile', UserRound],
] as const;

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Bottom Navigation">
      {tabs.map(([href, label, Icon]) => {
        const isActive = path === href;
        return (
          <Link
            key={href}
            href={href}
            className={isActive ? 'active' : ''}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

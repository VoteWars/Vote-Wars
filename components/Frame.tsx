'use client'

import { useEffect } from 'react';
import Backdrop from './Backdrop';
import SiteHeader from './SiteHeader';
import BottomNav from './BottomNav';

export default function Frame({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const purge = () => {
      document
        .querySelectorAll(
          '#nl-badge-frame, #nl-hud-frame, iframe[title*="Netlify"], iframe[title*="Powered by Netlify"], script[data-nf-variant]'
        )
        .forEach((el) => {
          el.remove();
        });
    };

    purge();
    const observer = new MutationObserver(purge);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Backdrop />
      <SiteHeader />
      <main className="page-wrap">{children}</main>
      <BottomNav />
    </>
  );
}

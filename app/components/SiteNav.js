'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/session';
import { CAFE_NAME } from '@/lib/brand';
import { haptic } from '@/lib/fx';
import { CupMark, QrIcon } from './Brand';
import { ScanButton } from './Scanner';
import ReadyAlerts from './ReadyAlerts';
import ServiceButton from './ServiceButton';

// Top bar shared by every customer page. "Scan menu" is always one tap away.
export default function SiteNav({ links = [] }) {
  const [solid, setSolid] = useState(false);
  const path = usePathname();
  const { ready, scanned, token, phone } = useSession();
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={`print:hidden fixed top-0 inset-x-0 z-40 transition-all duration-300 ${solid ? 'bg-espresso/85 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 text-foam group min-w-0 flex-1 md:flex-none">
          <CupMark className="w-8 h-8 text-latte shrink-0 transition-transform group-hover:rotate-[-8deg] group-hover:scale-110" />
          <span className="font-display font-bold text-base sm:text-lg leading-none truncate">{CAFE_NAME}</span>
        </Link>
        <nav className="hidden md:flex gap-6 ml-8 text-sm text-foam/80">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="hover:text-foam relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-latte hover:after:w-full after:transition-all">{label}</a>
          ))}
        </nav>
        <div className="hidden md:block flex-1" />
        {token && phone && <ServiceButton token={token} />}
        {ready && !scanned && (
          <ScanButton className="btn btn-primary pulse-ring shrink-0 px-3.5 sm:px-5 py-2.5 text-sm">
            <QrIcon className="w-4 h-4 sm:w-5 sm:h-5" /> <span>Scan menu</span>
          </ScanButton>
        )}
        {ready && scanned && path !== '/menu' && (
          <Link href="/menu" onClick={() => haptic('tap')} className="btn btn-primary shrink-0 px-4 sm:px-5 py-2.5 text-sm">View menu</Link>
        )}
      </div>
      {token && phone && <ReadyAlerts token={token} phone={phone} />}
    </header>
  );
}

'use client';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CURRENCY } from '@/lib/brand';
import { burstConfetti, haptic, ripple } from '@/lib/fx';
import { PhotoBg } from '../components/Brand';
import SiteNav from '../components/SiteNav';
import MyOrders from '../components/MyOrders';
import { useSession } from '@/lib/session';

function Inner() {
  const p = useSearchParams();
  const table = p.get('table');
  const { token, phone } = useSession();
  useEffect(() => { haptic('success'); burstConfetti(40); }, []);
  return (
    <>
      <PhotoBg src="/img/tw-10.jpg" pos="center 40%" />
      <SiteNav />
      <main className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 text-foam">
        <div className="w-28 h-28 rounded-full bg-sage flex items-center justify-center pop shadow-2xl pulse-ring">
          <svg viewBox="0 0 52 52" className="w-16 h-16"><path className="draw" d="M14 27l8 8 16-17" fill="none" stroke="#FFFaf2" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h1 className="rise font-display font-bold text-5xl mt-8" style={{ '--d': '200ms' }}>Order placed!</h1>
        <p className="rise mt-3 text-latte text-lg" style={{ '--d': '300ms' }}>Order <b className="text-foam">#{p.get('n')}</b> · Table <b className="text-foam">{table}</b></p>
        <p className="rise mt-6 max-w-xs text-foam/85" style={{ '--d': '400ms' }}>
          Thank you! Our team is preparing your order and will bring it to your table shortly.
        </p>
        <p className="rise mt-3 glass rounded-full px-5 py-2 text-sm" style={{ '--d': '500ms' }}>This order: {CURRENCY}{p.get('total')}</p>
        <Link
          href="/menu"
          onPointerDown={ripple}
          onClick={() => haptic('tap')}
          className="rise btn btn-primary mt-10 mb-24 px-8 py-4"
          style={{ '--d': '600ms' }}
        >
          Order something more
        </Link>
      </main>
      <MyOrders token={token} phone={phone} />
    </>
  );
}
export default function Page() {
  return <Suspense><Inner /></Suspense>;
}

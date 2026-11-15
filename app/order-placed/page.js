'use client';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CURRENCY } from '@/lib/brand';
import { burstConfetti, haptic, ripple } from '@/lib/fx';
import { useSession } from '@/lib/session';
import { PhotoBg } from '../components/Brand';
import SiteNav from '../components/SiteNav';
import MyOrders from '../components/MyOrders';
import OrderTracker from '../components/OrderTracker';
import WaitGames from '../components/WaitGames';

function Inner() {
  const p = useSearchParams();
  const table = p.get('table');
  const { token, phone } = useSession();
  useEffect(() => { haptic('success'); burstConfetti(40); }, []);
  return (
    <>
      <PhotoBg src="/img/tw-10.jpg" pos="center 40%" />
      <SiteNav />
      <main className="min-h-screen flex flex-col items-center text-center px-4 pt-24 pb-32 text-foam gap-6">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-sage flex items-center justify-center pop shadow-2xl pulse-ring">
            <svg viewBox="0 0 52 52" className="w-14 h-14"><path className="draw" d="M14 27l8 8 16-17" fill="none" stroke="#FFFaf2" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h1 className="rise font-display font-bold text-4xl sm:text-5xl mt-6" style={{ '--d': '200ms' }}>Order placed!</h1>
          <p className="rise mt-2 text-latte text-lg" style={{ '--d': '300ms' }}>Order <b className="text-foam">#{p.get('n')}</b> · Table <b className="text-foam">{table}</b></p>
          <p className="rise mt-3 glass rounded-full px-5 py-2 text-sm" style={{ '--d': '400ms' }}>This order: {CURRENCY}{p.get('total')}</p>
        </div>

        <OrderTracker token={token} phone={phone} number={p.get('n')} />
        {token && phone && <WaitGames token={token} phone={phone} table={table} />}

        <Link
          href="/menu"
          onPointerDown={ripple}
          onClick={() => haptic('tap')}
          className="btn btn-primary px-8 py-4"
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

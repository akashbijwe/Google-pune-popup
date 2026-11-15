'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CAFE_NAME, OUTLET, INFO, CURRENCY } from '@/lib/brand';
import { money } from '@/lib/bill';
import { haptic, ripple } from '@/lib/fx';
import { useSession } from '@/lib/session';
import { CupMark, PhotoBg } from '../components/Brand';
import SiteNav from '../components/SiteNav';

const SIZE = { S: 'Small', M: 'Medium', L: 'Large' };
const METHOD = { card: 'Card', upi: 'UPI', netbanking: 'Netbanking', wallet: 'Wallet' };

function Inner() {
  const id = useSearchParams().get('id');
  const { ready, phone } = useSession();
  const [bill, setBill] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!ready || !id) return;
    fetch(`/api/bills/${id}?phone=${encodeURIComponent(phone)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setBill)
      .catch(() => setMissing(true));
  }, [ready, id, phone]);

  return (
    <>
      <PhotoBg src="/img/tw-9.jpg" animate={false} />
      <SiteNav />
      <main className="min-h-screen px-4 pt-24 pb-16 print:pt-0 print:pb-0">
        {missing || !id ? (
          <div className="max-w-md mx-auto bg-foam rounded-3xl p-8 text-center shadow-2xl">
            <h1 className="font-display font-bold text-2xl">Bill not found</h1>
            <p className="text-roast/80 mt-1">This bill isn't available in this browser session.</p>
            <Link href="/" className="btn btn-primary mt-6 px-7 py-3.5">Back to home</Link>
          </div>
        ) : !bill ? (
          <p className="text-center text-foam font-display italic text-xl mt-24">Loading your bill…</p>
        ) : (
          <div className="max-w-md mx-auto">
            <article className="relative bg-white text-espresso rounded-3xl shadow-2xl p-7 pop print:shadow-none print:rounded-none">
              <div className="absolute right-6 top-6 -rotate-12 border-4 border-green-700 text-green-700 rounded-lg px-3 py-1 font-extrabold tracking-widest text-lg pop" style={{ animationDelay: '.4s' }}>PAID</div>
              <div className="flex items-center gap-2 text-caramel"><CupMark className="w-9 h-9" /></div>
              <h1 className="font-display font-bold text-2xl mt-1">{CAFE_NAME}</h1>
              <p className="text-sm text-roast">{OUTLET}, Pune</p>
              <p className="text-xs text-roast/70 mt-1">{INFO.address}</p>
              <p className="text-xs text-roast/70">Tel {INFO.phone}</p>

              <div className="mt-5 grid grid-cols-2 gap-y-1 text-sm border-y border-dashed border-latte py-3">
                <span className="text-roast/70">Bill no.</span><span className="text-right font-semibold">TW-{String(bill.billNo).padStart(4, '0')}</span>
                <span className="text-roast/70">Date</span><span className="text-right">{new Date(bill.paidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <span className="text-roast/70">Table</span><span className="text-right">{bill.table}</span>
                <span className="text-roast/70">Guest</span><span className="text-right">+91 {bill.phone.slice(-10)}</span>
              </div>

              <div className="mt-4 space-y-4">
                {bill.orders.map((o) => (
                  <div key={o.number}>
                    <div className="text-xs font-semibold uppercase tracking-widest text-roast/60">Order #{String(o.number).padStart(3, '0')}</div>
                    <ul className="mt-1">
                      {o.items.map((i, k) => (
                        <li key={k} className="py-1.5 flex justify-between gap-3 text-sm">
                          <span>
                            {i.qty} × {i.name}
                            <span className="block text-xs text-roast/60">
                              {[i.size && SIZE[i.size], i.sugar, i.milk, i.extraShot && 'Extra shot'].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          <span>{CURRENCY}{money(i.unitPrice * i.qty)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-latte text-sm space-y-1.5">
                <div className="flex justify-between"><span>Subtotal</span><span>{CURRENCY}{money(bill.subtotal)}</span></div>
                {bill.discount > 0 && <div className="flex justify-between text-green-700 font-semibold"><span>Coffee quiz discount</span><span>−{CURRENCY}{money(bill.discount)}</span></div>}
                <div className="flex justify-between text-roast"><span>CGST ({bill.rate}%)</span><span>{CURRENCY}{money(bill.cgst)}</span></div>
                <div className="flex justify-between text-roast"><span>SGST ({bill.rate}%)</span><span>{CURRENCY}{money(bill.sgst)}</span></div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-latte"><span>Total paid</span><span>{CURRENCY}{money(bill.total)}</span></div>
              </div>

              <div className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm">
                <span className="text-roast/70">Paid via </span><b>{METHOD[bill.method]}</b>{bill.ref && <span> · {bill.ref}</span>}
              </div>
              <p className="mt-5 text-center text-sm font-medium">Thank you for visiting! Brewing happiness in a cup. ☕</p>
              <p className="mt-2 text-center text-[11px] text-roast/50">Demo receipt: the payment was simulated and no money was charged.</p>
            </article>

            <div className="mt-5 flex gap-3 print:hidden">
              <button onPointerDown={ripple} onClick={() => { haptic('tap'); window.print(); }} className="btn btn-primary flex-1 py-3.5">Print / Save PDF</button>
              <Link href="/" onPointerDown={ripple} onClick={() => haptic('tap')} className="btn btn-ghost flex-1 py-3.5">Done</Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default function Page() {
  return <Suspense><Inner /></Suspense>;
}

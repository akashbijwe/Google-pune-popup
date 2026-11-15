'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CURRENCY } from '@/lib/brand';
import { computeBill, money } from '@/lib/bill';
import { haptic, ripple } from '@/lib/fx';

const STATUS = {
  new: ['Received', 'bg-caramel/15 text-caramel'],
  prepared: ['Ready', 'bg-sage/15 text-sage'],
  served: ['Served', 'bg-roast/10 text-roast'],
};
const SIZE = { S: 'Small', M: 'Medium', L: 'Large' };

// Always-visible bar with the running total of this guest's orders. Tap to see them all.
export default function MyOrders({ token, phone, onCount }) {
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [discount, setDiscount] = useState(0);

  const load = useCallback(async () => {
    if (!token || !phone) return;
    try {
      const r = await fetch(`/api/orders/mine?token=${encodeURIComponent(token)}&phone=${encodeURIComponent(phone)}`, { cache: 'no-store' });
      if (r.ok) setOrders(await r.json());
      const d = await fetch(`/api/discount?token=${encodeURIComponent(token)}&phone=${encodeURIComponent(phone)}`, { cache: 'no-store' });
      if (d.ok) setDiscount((await d.json()).amount || 0);
    } catch {}
  }, [token, phone]);

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);
  useEffect(() => { onCount?.(orders.length); }, [orders.length, onCount]);

  if (!orders.length) return null;
  const bill = computeBill(orders, discount);

  return (
    <>
      <div className="fixed bottom-4 left-0 right-0 px-4 z-40 flex justify-center">
        <button
          onPointerDown={ripple}
          onClick={() => { haptic('tap'); setOpen(true); }}
          className="btn w-full max-w-lg px-5 py-3.5 justify-between bg-foam text-espresso border border-latte/60 shadow-2xl"
        >
          <span>🧾 Your orders ({orders.length})</span>
          <span className="font-bold">{CURRENCY}{money(bill.total)} · Checkout ›</span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[55] flex items-end justify-center bg-espresso/60 backdrop-blur-sm fade-in" onClick={() => setOpen(false)}>
          <div className="slide-up w-full max-w-lg max-h-[90vh] flex flex-col bg-cream rounded-t-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 pb-3">
              <div>
                <h2 className="font-display font-bold text-3xl">Your orders</h2>
                <p className="text-sm text-roast/70">Everything you've ordered so far</p>
              </div>
              <button onClick={() => { haptic('tap'); setOpen(false); }} className="w-9 h-9 rounded-full bg-foam text-roast active:scale-90 transition" aria-label="Close">✕</button>
            </div>

            <div className="overflow-y-auto px-6 space-y-4 pb-4">
              {orders.map((o) => {
                const [label, cls] = STATUS[o.status] || STATUS.new;
                return (
                  <div key={o.id} className="bg-foam rounded-2xl border border-latte/30 p-4">
                    <div className="flex justify-between items-center">
                      <b>Order #{String(o.number).padStart(3, '0')}</b>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
                    </div>
                    <ul className="mt-2 divide-y divide-latte/20">
                      {o.items.map((i, k) => (
                        <li key={k} className="py-2 flex justify-between gap-3 text-sm">
                          <span>
                            {i.qty} × {i.name}
                            <span className="block text-xs text-roast/60">
                              {[i.size && SIZE[i.size], i.sugar, i.milk, i.extraShot && 'Extra shot'].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          <span className="font-medium">{CURRENCY}{i.unitPrice * i.qty}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between pt-2 border-t border-latte/30 text-sm font-semibold">
                      <span>Order total</span><span>{CURRENCY}{o.total}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 pt-4 border-t border-latte/40 bg-cream rounded-t-3xl">
              <div className="space-y-1 text-sm text-roast">
                <div className="flex justify-between"><span>Subtotal</span><span>{CURRENCY}{money(bill.subtotal)}</span></div>
                {bill.discount > 0 && <div className="flex justify-between text-sage font-semibold"><span>Quiz discount 🎉</span><span>−{CURRENCY}{money(bill.discount)}</span></div>}
                <div className="flex justify-between"><span>CGST ({bill.rate}%)</span><span>{CURRENCY}{money(bill.cgst)}</span></div>
                <div className="flex justify-between"><span>SGST ({bill.rate}%)</span><span>{CURRENCY}{money(bill.sgst)}</span></div>
              </div>
              <div className="flex justify-between text-lg font-bold my-3"><span>Total</span><span>{CURRENCY}{money(bill.total)}</span></div>
              <Link href="/checkout" onPointerDown={ripple} onClick={() => haptic('tap')} className="btn btn-primary w-full py-4 text-base">Checkout · {CURRENCY}{money(bill.total)}</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

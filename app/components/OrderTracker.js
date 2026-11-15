'use client';
import { useEffect, useState } from 'react';

const LINES = ['Grinding fresh beans…', 'Pulling the shot…', 'Steaming the milk…', 'Adding the finishing touch…'];
const STAGES = ['Received', 'Brewing', 'Ready', 'Served'];
const pad = (n) => String(n).padStart(2, '0');
const CUP = 'M22 48h68v18a34 34 0 0 1-34 44h0a34 34 0 0 1-34-44V48Z';

// Live "barista cam": the cup fills while the order brews and the card turns green when it's ready.
export default function OrderTracker({ token, phone, number }) {
  const [order, setOrder] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (!token || !phone) return;
    let live = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/orders/mine?token=${encodeURIComponent(token)}&phone=${encodeURIComponent(phone)}&all=1`, { cache: 'no-store' });
        if (!r.ok || !live) return;
        const found = (await r.json()).find((o) => o.number === Number(number));
        if (found) setOrder(found);
      } catch {}
    };
    load();
    const t = setInterval(load, 4000);
    return () => { live = false; clearInterval(t); };
  }, [token, phone, number]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setInterval(() => setLine((l) => (l + 1) % LINES.length), 3000); return () => clearInterval(t); }, []);

  if (!order) return null;
  const status = order.status; // new | prepared | served
  const stage = status === 'new' ? 1 : status === 'prepared' ? 2 : 3;
  const qty = order.items.reduce((s, i) => s + i.qty, 0);
  const etaMs = (4 + Math.min(6, qty)) * 60000; // a rough estimate only
  const remain = Math.max(0, order.createdAt + etaMs - now);
  const ready = status !== 'new';
  const progress = ready ? 1 : Math.max(0.12, Math.min(0.92, (now - order.createdAt) / etaMs));

  return (
    <section className="w-full max-w-lg bg-foam text-espresso rounded-3xl shadow-2xl overflow-hidden text-left" aria-live="polite">
      <div className={`px-6 py-4 transition-colors duration-700 ${ready ? 'bg-sage text-foam' : 'bg-espresso text-foam'}`}>
        <h2 className="font-display font-bold text-xl">
          {status === 'new' ? 'Your order is brewing' : status === 'prepared' ? 'Your order is ready! 🎉' : 'Enjoy your order ☕'}
        </h2>
        <p className="text-sm opacity-80">
          {status === 'new' ? LINES[line] : status === 'prepared' ? 'Our team is bringing it to your table.' : 'Served. Have a lovely time!'}
        </p>
      </div>

      <div className="p-6 flex items-center gap-5">
        <svg viewBox="0 0 120 140" className="w-28 h-32 sm:w-32 sm:h-36 shrink-0" aria-hidden="true">
          <defs><clipPath id="cupclip"><path d={CUP} /></clipPath></defs>
          <path className="steam" d="M42 36c-5-8 5-10 0-20" stroke="#B5703A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path className="steam" style={{ animationDelay: '.7s' }} d="M58 36c-5-8 5-10 0-20" stroke="#B5703A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path className="steam" style={{ animationDelay: '1.4s' }} d="M74 36c-5-8 5-10 0-20" stroke="#B5703A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M90 56h8a12 12 0 0 1 0 26h-12" stroke="#2E1F17" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d={CUP} fill="#FFFaf2" />
          <g clipPath="url(#cupclip)">
            <g style={{ transform: `translateY(${(1 - progress) * 66}px)`, transition: 'transform 1.4s ease' }}>
              <rect x="10" y="52" width="100" height="90" fill="#8a5a3a" />
              <path className="wave" d="M-10 52q15-8 30 0t30 0t30 0t30 0t30 0t30 0V60H-10Z" fill="#c68a5b" />
              {[34, 52, 68, 80].map((x, i) => (
                <circle key={x} className="bubble" style={{ animationDelay: `${i * 0.55}s` }} cx={x} cy="104" r="3" fill="#E8B27D" />
              ))}
            </g>
          </g>
          <path d={CUP} fill="none" stroke="#2E1F17" strokeWidth="5" strokeLinejoin="round" />
          <ellipse cx="56" cy="124" rx="40" ry="6" fill="#2E1F17" opacity=".12" />
        </svg>

        <div className="flex-1 min-w-0">
          {status === 'new' ? (
            <>
              <div className="text-xs uppercase tracking-widest text-roast/60">Estimated wait</div>
              <div className="font-display font-bold text-4xl tabular-nums">
                {remain > 0 ? `${pad(Math.floor(remain / 60000))}:${pad(Math.floor((remain % 60000) / 1000))}` : 'Almost there'}
              </div>
              <p className="text-xs text-roast/60 mt-1">A rough estimate. It's ready when it's ready.</p>
            </>
          ) : (
            <div className="font-display font-bold text-2xl">Order #{String(order.number).padStart(3, '0')}</div>
          )}
          <ol className="mt-4 flex items-start">
            {STAGES.map((s, i) => (
              <li key={s} className="flex-1 flex flex-col items-center relative">
                {i > 0 && <span className={`absolute right-1/2 top-2.5 h-0.5 w-full transition-colors duration-700 ${i <= stage ? 'bg-caramel' : 'bg-latte/40'}`} />}
                <span className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] transition-all duration-500 ${i < stage ? 'bg-caramel border-caramel text-foam' : i === stage ? `border-caramel bg-foam ${status === 'new' ? 'pulse-ring' : ''}` : 'border-latte/50 bg-foam'}`}>
                  {i < stage ? '✓' : ''}
                </span>
                <span className={`mt-1 text-[11px] ${i <= stage ? 'font-semibold' : 'text-roast/50'}`}>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

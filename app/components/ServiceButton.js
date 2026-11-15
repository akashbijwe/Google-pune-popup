'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { haptic, ripple } from '@/lib/fx';

export const SERVICES = [
  ['waiter', '🛎️', 'Call waiter', 'We will come to your table'],
  ['water', '💧', 'Water', 'A fresh glass of water'],
  ['tissues', '🧻', 'Tissues', 'Napkins and tissues'],
  ['bill', '🧾', 'Bring the bill', 'Ready to leave? Or pay on your phone'],
];

const ago = (t) => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? 'just now' : `${m} min ago`; };

// One-tap requests that show up on the staff panel with this table's number.
export default function ServiceButton({ token }) {
  const [open, setOpen] = useState(false);
  const [table, setTable] = useState('');
  const [pending, setPending] = useState([]);
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState('');
  const prev = useRef(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/requests/mine?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      setTable(d.table);
      if (prev.current) {
        const done = prev.current.filter((p) => !d.pending.some((x) => x.id === p.id));
        if (done.length) {
          const label = SERVICES.find((s) => s[0] === done[0].type)?.[2] || 'Request';
          haptic('success'); setToast(`${label}: on its way ✓`); setTimeout(() => setToast(''), 4000);
        }
      }
      prev.current = d.pending; setPending(d.pending);
    } catch {}
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!open && !pending.length) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [open, pending.length, load]);

  async function ask(type) {
    if (busy || pending.some((p) => p.type === type)) return;
    setBusy(type); haptic('add');
    try {
      const r = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, type }) });
      if (r.ok) { await load(); haptic('success'); } else haptic('error');
    } catch { haptic('error'); }
    setBusy('');
  }

  return (
    <>
      <button
        onPointerDown={ripple}
        onClick={() => { haptic('tap'); setOpen(true); load(); }}
        aria-label="Call waiter or request help"
        className="relative btn glass shrink-0 w-11 h-11 sm:w-auto sm:px-4 text-foam"
      >
        <span className="text-lg leading-none">🛎️</span>
        <span className="hidden sm:inline text-sm">Help</span>
        {pending.length > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-caramel border-2 border-espresso animate-pulse" />}
      </button>

      {toast && <div className="toast fixed top-20 left-1/2 z-[80] bg-sage text-foam rounded-full px-5 py-2.5 text-sm font-semibold shadow-2xl whitespace-nowrap" role="status">{toast}</div>}

      {open && (
        <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center bg-espresso/60 backdrop-blur-sm fade-in text-espresso" onClick={() => setOpen(false)}>
          <div className="slide-up w-full max-w-md bg-cream rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-display font-bold text-3xl">How can we help?</h2>
                <p className="text-sm text-roast/70">{table ? `Table ${table}. ` : ''}Tap once and our team will come over.</p>
              </div>
              <button onClick={() => { haptic('tap'); setOpen(false); }} className="w-9 h-9 rounded-full bg-foam text-roast active:scale-90 transition" aria-label="Close">✕</button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {SERVICES.map(([type, emoji, label, hint]) => {
                const p = pending.find((x) => x.type === type);
                return (
                  <button key={type} onPointerDown={ripple} onClick={() => ask(type)} disabled={!!p || busy === type}
                    className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition active:scale-95 ${p ? 'bg-sage/15 border-sage' : 'bg-foam border-latte/50 hover:border-caramel hover:-translate-y-0.5'}`}>
                    <div className={`text-3xl ${p ? 'bump' : ''}`}>{emoji}</div>
                    <div className="font-semibold mt-1">{label}</div>
                    <div className={`text-xs mt-0.5 ${p ? 'text-sage font-semibold' : 'text-roast/60'}`}>
                      {busy === type ? 'Sending…' : p ? `Requested ✓ · ${ago(p.createdAt)}` : hint}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-roast/60">Already asked? We've got it. No need to tap twice.</p>
          </div>
        </div>
      )}
    </>
  );
}

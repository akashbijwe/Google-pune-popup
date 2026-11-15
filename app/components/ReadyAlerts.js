'use client';
import { useEffect, useRef, useState } from 'react';
import { haptic } from '@/lib/fx';
import Portal from './Portal';

function chime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.2;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.start(t); o.stop(t + 0.4);
    });
  } catch {}
}

// Watches this guest's orders; when one flips to "ready": buzz + soft chime + banner.
export default function ReadyAlerts({ token, phone }) {
  const prev = useRef(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token || !phone) return;
    let live = true;
    const poll = async () => {
      try {
        const r = await fetch(`/api/orders/mine?token=${encodeURIComponent(token)}&phone=${encodeURIComponent(phone)}&all=1`, { cache: 'no-store' });
        if (!r.ok || !live) return;
        const orders = await r.json();
        const now = Object.fromEntries(orders.map((o) => [o.id, o.status]));
        if (prev.current) {
          const ready = orders.filter((o) => o.status === 'prepared' && prev.current[o.id] === 'new');
          if (ready.length) {
            haptic([60, 60, 60, 60, 160]); chime();
            setMsg(`Order #${String(ready[0].number).padStart(3, '0')} is ready! 🎉`);
            setTimeout(() => setMsg(''), 7000);
          }
        }
        prev.current = now;
      } catch {}
    };
    poll();
    const t = setInterval(poll, 5000);
    return () => { live = false; clearInterval(t); };
  }, [token, phone]);

  if (!msg) return null;
  return (
    <Portal>
    <button onClick={() => setMsg('')} className="toast fixed top-20 left-1/2 z-[80] w-[92vw] max-w-md bg-sage text-foam rounded-2xl px-5 py-3 text-center font-semibold shadow-2xl print:hidden" role="status">
      {msg} <span className="block opacity-80 text-sm font-normal">Coming to your table</span>
    </button>
    </Portal>
  );
}

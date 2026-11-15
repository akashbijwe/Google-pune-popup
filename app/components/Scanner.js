'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/session';
import jsQR from 'jsqr';
import { haptic, ripple } from '@/lib/fx';
import { QrIcon } from './Brand';
import Portal from './Portal';

// Accepts a full scanned URL (…/menu?table=<code>) or a bare code.
function extractToken(text) {
  const t = String(text || '').trim();
  try { return new URL(t).searchParams.get('table') || ''; } catch { return t; }
}

async function validate(token) {
  if (!token) return false;
  try { return (await fetch(`/api/table?t=${encodeURIComponent(token)}`, { cache: 'no-store' })).ok; } catch { return false; }
}

export function Scanner({ onClose }) {
  const router = useRouter();
  const video = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | scanning | denied | unsupported | ok
  const [msg, setMsg] = useState('');
  const [shake, setShake] = useState(0);
  const [manual, setManual] = useState('');
  const busy = useRef(false);
  const alive = useRef(true);

  async function accept(raw) {
    if (busy.current) return;
    busy.current = true;
    const token = extractToken(raw);
    if (await validate(token)) {
      haptic('scan');
      setStatus('ok');
      setMsg('Table found!');
      setTimeout(() => { onClose(); router.push(`/menu?table=${encodeURIComponent(token)}`); }, 700);
    } else {
      haptic('error');
      setShake((s) => s + 1);
      setMsg("That isn't a Third Wave table code. Try again.");
      setTimeout(() => { busy.current = false; setMsg(''); }, 1800);
    }
  }

  useEffect(() => {
    alive.current = true;
    let stream, raf;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) { setStatus('unsupported'); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (!alive.current) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = video.current;
        v.srcObject = stream;
        await v.play();
        setStatus('scanning');
        const tick = () => {
          if (!alive.current) return;
          if (!busy.current && v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth) {
            const w = 480, h = Math.round((v.videoHeight / v.videoWidth) * w);
            canvas.width = w; canvas.height = h;
            ctx.drawImage(v, 0, 0, w, h);
            const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
            if (code?.data) accept(code.data);
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        setStatus(e?.name === 'NotAllowedError' ? 'denied' : 'unsupported');
      }
    }
    start();
    return () => { alive.current = false; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noCam = status === 'denied' || status === 'unsupported';

  return (
    <div className="fixed inset-0 z-[70] bg-espresso/95 backdrop-blur overflow-y-auto fade-in" role="dialog" aria-label="Scan table QR code">
      <div className="min-h-full flex flex-col items-center justify-center p-5 pt-16">
      <button onClick={() => { haptic('tap'); onClose(); }} className="fixed right-4 top-4 w-11 h-11 rounded-full glass text-foam text-lg" aria-label="Close scanner">✕</button>
      <h2 className="font-display text-3xl text-foam text-center">Scan your table QR</h2>
      <p className="text-latte mt-1 text-center text-sm">Point your camera at the code on your table.</p>

      <div key={shake} style={{ width: 'min(100%, 24rem, 48vh)' }} className={`relative mt-6 aspect-square rounded-3xl overflow-hidden bg-black border border-foam/20 ${shake ? 'shake' : ''}`}>
        <video ref={video} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        {status === 'scanning' && <div className="scanline" />}
        {/* corner brackets */}
        {['top-3 left-3 border-t-4 border-l-4 rounded-tl-2xl', 'top-3 right-3 border-t-4 border-r-4 rounded-tr-2xl',
          'bottom-3 left-3 border-b-4 border-l-4 rounded-bl-2xl', 'bottom-3 right-3 border-b-4 border-r-4 rounded-br-2xl'].map((c) => (
          <span key={c} className={`absolute w-10 h-10 border-caramel ${c}`} />
        ))}
        {status === 'starting' && <div className="absolute inset-0 flex items-center justify-center text-foam/80 text-sm">Starting camera…</div>}
        {status === 'ok' && (
          <div className="absolute inset-0 bg-sage/80 flex items-center justify-center">
            <svg viewBox="0 0 52 52" className="w-24 h-24 pop"><path className="draw" d="M14 27l8 8 16-17" fill="none" stroke="#FFFaf2" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        )}
        {noCam && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-foam/90 text-sm bg-espresso">
            <QrIcon className="w-10 h-10 text-latte mb-3" />
            {status === 'denied'
              ? 'Camera access was blocked. Allow it in your browser settings, or enter the code below.'
              : 'The camera is not available here. Scanning needs HTTPS (or localhost) and a camera. You can enter the code below instead.'}
          </div>
        )}
      </div>

      <p className={`mt-4 min-h-[1.5rem] text-sm text-center ${status === 'ok' ? 'text-sage font-semibold' : 'text-red-300'}`} aria-live="polite">{msg}</p>

      <form
        className="mt-2 w-full max-w-sm flex gap-2"
        onSubmit={(e) => { e.preventDefault(); haptic('tap'); accept(manual); }}
      >
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Or paste the code / link"
          className="flex-1 min-w-0 rounded-full bg-foam/10 border border-foam/25 text-foam placeholder:text-foam/50 px-4 py-3 text-sm outline-none focus:border-caramel"
        />
        <button className="btn btn-primary px-5" onPointerDown={ripple}>Go</button>
      </form>
      </div>
    </div>
  );
}

// A button that opens the scanner. Style it with className.
// Once a table has been scanned in this session it becomes a plain "View menu" link instead.
export function ScanButton({ className = '', children, scannedLabel = 'View menu' }) {
  const [open, setOpen] = useState(false);
  const { ready, scanned } = useSession();
  if (!ready) return null;
  if (scanned)
    return <Link href="/menu" className={className} onPointerDown={ripple} onClick={() => haptic('tap')}>{scannedLabel}</Link>;
  return (
    <>
      <button className={className} onPointerDown={ripple} onClick={() => { haptic('tap'); setOpen(true); }}>
        {children}
      </button>
      {open && <Portal><Scanner onClose={() => setOpen(false)} /></Portal>}
    </>
  );
}

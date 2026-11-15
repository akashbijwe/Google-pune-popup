'use client';
import { useEffect, useRef, useState } from 'react';
import { haptic, ripple } from '@/lib/fx';
import { CAFE_NAME } from '@/lib/brand';
import { CupMark } from './Brand';

// Step 1: phone number. Step 2: 6-digit OTP. Demo mode: anything is accepted.
export default function PhoneGate({ table, onVerified }) {
  const [step, setStep] = useState('phone'); // phone | otp | done
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const [shake, setShake] = useState(0);
  const boxes = useRef([]);

  useEffect(() => { if (wait > 0) { const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); } }, [wait]);
  useEffect(() => { if (step === 'otp') boxes.current[0]?.focus(); }, [step]);

  const digits = phone.replace(/\D/g, '');
  const fail = (m) => { haptic('error'); setErr(m); setShake((s) => s + 1); };

  function sendOtp(e) {
    e.preventDefault();
    if (digits.length !== 10) return fail('Enter a 10-digit mobile number.');
    setErr(''); setBusy(true); haptic('select');
    setTimeout(() => { setBusy(false); setStep('otp'); setWait(30); haptic('success'); }, 700);
  }

  function setDigit(i, v) {
    const d = v.replace(/\D/g, '');
    if (d.length > 1) { // paste
      const next = ['', '', '', '', '', ''];
      d.slice(0, 6).split('').forEach((c, k) => (next[k] = c));
      setOtp(next); haptic('tap');
      boxes.current[Math.min(d.length, 5)]?.focus();
      return;
    }
    const next = [...otp]; next[i] = d; setOtp(next);
    if (d) { haptic('tap'); boxes.current[i + 1]?.focus(); }
  }

  function verify(e) {
    e?.preventDefault();
    if (otp.join('').length !== 6) return fail('Enter all 6 digits.');
    setErr(''); setBusy(true);
    setTimeout(() => {
      setBusy(false); setStep('done'); haptic('success');
      setTimeout(() => onVerified(digits), 1000);
    }, 700);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-espresso/70 backdrop-blur-md fade-in">
      <div key={shake} className={`w-full max-w-md rounded-3xl bg-foam p-7 shadow-2xl pop ${shake ? 'shake' : ''}`}>
        <div className="flex items-center gap-2 text-caramel"><CupMark className="w-8 h-8" /><span className="font-display font-bold text-espresso">{CAFE_NAME}</span></div>

        {step === 'done' ? (
          <div className="py-10 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-sage flex items-center justify-center pop">
              <svg viewBox="0 0 52 52" className="w-12 h-12"><path className="draw" d="M14 27l8 8 16-17" fill="none" stroke="#FFFaf2" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h2 className="font-display text-2xl mt-5">You're in!</h2>
            <p className="text-roast/80 mt-1">Table {table} is ready. Opening the menu…</p>
          </div>
        ) : step === 'phone' ? (
          <form onSubmit={sendOtp}>
            <div className="mt-4 inline-flex items-center gap-2 bg-sage/15 text-sage rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-sage animate-pulse" /> Table {table} found
            </div>
            <h2 className="font-display text-3xl mt-3">What's your number?</h2>
            <p className="text-roast/80 text-sm mt-1">We'll use it to confirm your order.</p>
            <div className="mt-5 flex items-center rounded-2xl border-2 border-latte/50 bg-white focus-within:border-caramel transition overflow-hidden">
              <span className="pl-4 pr-2 text-roast font-semibold">+91</span>
              <input
                autoFocus inputMode="numeric" autoComplete="tel-national" maxLength={14}
                value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ''))}
                placeholder="98765 43210" aria-label="Mobile number"
                className="flex-1 min-w-0 py-3.5 pr-4 text-lg tracking-wide outline-none bg-transparent"
              />
            </div>
            <p className="mt-3 text-xs rounded-xl bg-caramel/10 text-roast px-3 py-2">
              <b>Demo mode:</b> any random 10-digit number is accepted.
            </p>
            {err && <p className="text-red-700 text-sm mt-3" role="alert">{err}</p>}
            <button disabled={busy} onPointerDown={ripple} className="btn btn-primary w-full mt-5 py-3.5 text-base disabled:opacity-60">
              {busy ? 'Sending code…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verify}>
            <h2 className="font-display text-3xl mt-4">Enter the OTP</h2>
            <p className="text-roast/80 text-sm mt-1">Sent to +91 {digits}. <button type="button" onClick={() => { haptic('tap'); setStep('phone'); setOtp(['', '', '', '', '', '']); }} className="text-caramel underline">Change</button></p>
            <div className="mt-5 flex justify-between gap-2" onPaste={(e) => { e.preventDefault(); setDigit(0, e.clipboardData.getData('text')); }}>
              {otp.map((d, i) => (
                <input
                  key={i} ref={(el) => (boxes.current[i] = el)} value={d}
                  inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={1} aria-label={`Digit ${i + 1}`}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otp[i] && i > 0) boxes.current[i - 1]?.focus();
                    if (e.key === 'ArrowLeft' && i > 0) boxes.current[i - 1]?.focus();
                    if (e.key === 'ArrowRight' && i < 5) boxes.current[i + 1]?.focus();
                  }}
                  className={`w-full min-w-0 aspect-[4/5] max-w-[3.4rem] text-center text-2xl font-bold rounded-xl border-2 outline-none bg-white transition ${d ? 'border-caramel bg-caramel/10' : 'border-latte/50'} focus:border-caramel focus:scale-105`}
                />
              ))}
            </div>
            <p className="mt-3 text-xs rounded-xl bg-caramel/10 text-roast px-3 py-2">
              <b>Demo mode:</b> any 6 digits work (e.g. 123456).
            </p>
            {err && <p className="text-red-700 text-sm mt-3" role="alert">{err}</p>}
            <button disabled={busy} onPointerDown={ripple} className="btn btn-primary w-full mt-5 py-3.5 text-base disabled:opacity-60">
              {busy ? 'Verifying…' : 'Verify & open menu'}
            </button>
            <button type="button" disabled={wait > 0} onClick={() => { haptic('select'); setWait(30); }} className="w-full mt-3 text-sm text-roast disabled:text-roast/40">
              {wait > 0 ? `Resend OTP in ${wait}s` : 'Resend OTP'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

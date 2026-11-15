'use client';
import { useState } from 'react';
import Link from 'next/link';
import { QUESTIONS, resultFor, makeCardBlob } from '@/lib/quiz';
import { burstConfetti, haptic, ripple } from '@/lib/fx';
import { CupMark, PhotoBg } from '../components/Brand';
import SiteNav from '../components/SiteNav';

export default function Quiz() {
  const [step, setStep] = useState(0); // 0..2 questions, 3 = brewing, 4 = result
  const [answers, setAnswers] = useState([]);
  const [note, setNote] = useState('');
  const result = step === 4 ? resultFor(answers) : null;

  function pick(v) {
    haptic('select');
    const next = [...answers, v];
    setAnswers(next);
    if (next.length < QUESTIONS.length) { setStep(step + 1); return; }
    setStep(3);
    setTimeout(() => { setStep(4); haptic('success'); burstConfetti(40); }, 1600);
  }
  function retake() { haptic('tap'); setAnswers([]); setStep(0); setNote(''); }

  async function share() {
    haptic('tap');
    try {
      const blob = await makeCardBlob(result);
      const file = new File([blob], 'my-coffee-personality.png', { type: 'image/png' });
      const text = `I'm a ${result.drink}: ${result.persona}! Find yours at Third Wave Coffee, Balewadi Highstreet.`;
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My coffee personality', text });
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'my-coffee-personality.png'; a.click();
      setNote('Card saved. Share it from your gallery!');
    } catch (e) {
      if (e?.name !== 'AbortError') setNote('Could not share. Try taking a screenshot.');
    }
  }

  const q = QUESTIONS[step];
  return (
    <>
      <PhotoBg src="/img/tw-6.jpg" />
      <SiteNav />
      <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12 text-foam">
        {step < 3 && (
          <div key={step} className="w-full max-w-xl text-center rise">
            <div className="flex justify-center gap-2 mb-6" aria-label={`Question ${step + 1} of 3`}>
              {QUESTIONS.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-10 bg-caramel' : 'w-6 bg-foam/30'}`} />)}
            </div>
            <p className="text-latte tracking-[.3em] text-xs uppercase font-semibold">What's your coffee personality?</p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl mt-3">{q.q}</h1>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[q.a, q.b].map((o) => (
                <button key={o.v} onPointerDown={ripple} onClick={() => pick(o.v)}
                  className="relative overflow-hidden glass rounded-3xl py-9 sm:py-12 flex flex-col items-center gap-3 hover:bg-foam/25 hover:-translate-y-1 active:scale-95 transition">
                  <span className="text-6xl sm:text-7xl float">{o.emoji}</span>
                  <span className="font-display font-bold text-xl">{o.label}</span>
                </button>
              ))}
            </div>
            {step > 0 && <button onClick={() => { haptic('tap'); setAnswers(answers.slice(0, -1)); setStep(step - 1); }} className="mt-6 text-sm text-foam/70 underline">← Back</button>}
          </div>
        )}

        {step === 3 && (
          <div className="text-center pop">
            <CupMark className="w-24 h-24 text-latte mx-auto" />
            <p className="font-display font-bold text-2xl mt-4">Brewing your personality…</p>
          </div>
        )}

        {result && (
          <div className="w-full max-w-sm">
            <article className="relative overflow-hidden rounded-3xl p-8 text-center shadow-2xl pop bg-gradient-to-br from-espresso to-roast border border-foam/15">
              <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-caramel/30 blur-2xl" />
              <p className="relative text-latte tracking-[.25em] text-[11px] uppercase font-semibold">Third Wave Coffee</p>
              <p className="relative mt-6 text-foam/80 text-sm tracking-widest">YOU'RE A</p>
              <div className="relative text-8xl my-2 float">{result.emoji}</div>
              <h2 className="relative font-display font-extrabold text-4xl">{result.drink}</h2>
              <p className="relative mt-2 text-latte font-bold text-lg">{result.persona}</p>
              <p className="relative mt-1 text-foam/80">{result.line}</p>
              <p className="relative mt-6 text-xs text-latte/80">Balewadi Highstreet · Just brew it.</p>
            </article>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onPointerDown={ripple} onClick={share} className="btn btn-ghost py-3.5">Share my card</button>
              <Link href={`/menu?pick=${result.id}`} onPointerDown={ripple} onClick={() => haptic('add')} className="btn btn-primary py-3.5">Order it ☕</Link>
            </div>
            {note && <p className="mt-3 text-center text-sm text-latte" role="status">{note}</p>}
            <button onClick={retake} className="mt-4 w-full text-sm text-foam/70 underline">Retake the quiz</button>
          </div>
        )}
      </main>
    </>
  );
}

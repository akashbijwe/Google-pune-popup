'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CURRENCY, QUIZ_OFF } from '@/lib/brand';
import { haptic, reducedMotion, ripple } from '@/lib/fx';

const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

function Overlay({ children }) {
  return <div className="absolute inset-0 z-10 bg-foam/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 pop">{children}</div>;
}

/* ------------------------------------------------------------------ Trivia (checked on the server) */
function Trivia({ token, phone, onFinish }) {
  const [play, setPlay] = useState(null);
  const [err, setErr] = useState('');
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState(null);
  const [res, setRes] = useState(null);
  const [left, setLeft] = useState(10);
  const [paused, setPaused] = useState(false);
  const scoreRef = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    post('/api/trivia/start', { token, phone })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setPlay)
      .catch(() => setErr('Could not load the quiz. Please try again.'));
  }, [token, phone]);

  useEffect(() => {
    if (!play || picked !== null || paused) return;
    const t = setInterval(() => setLeft((l) => Math.max(0, +(l - 0.1).toFixed(1))), 100);
    return () => clearInterval(t);
  }, [play, picked, paused, i]);
  useEffect(() => { if (play && left === 0 && picked === null && !paused) answer(-1); /* eslint-disable-next-line */ }, [left]);

  async function end() {
    if (done.current) return;
    done.current = true;
    let info = {};
    try { const r = await post('/api/trivia/finish', { id: play.id }); if (r.ok) info = await r.json(); } catch {}
    onFinish(scoreRef.current, info);
  }

  async function answer(idx) {
    if (picked !== null || paused || !play) return;
    setPicked(idx); haptic('tap');
    let r = { correct: false, correctIdx: -1 };
    try { const x = await post('/api/trivia/answer', { id: play.id, i, choice: idx }); if (x.ok) r = await x.json(); } catch {}
    setRes(r);
    haptic(r.correct ? 'add' : 'error');
    if (r.correct) { scoreRef.current += 10 + Math.ceil(left); setScore(scoreRef.current); setCorrect((c) => c + 1); }
    setTimeout(() => {
      if (i + 1 >= play.questions.length) end();
      else { setI(i + 1); setPicked(null); setRes(null); setLeft(10); }
    }, 1300);
  }

  if (err) return <p className="text-center text-red-700 py-8">{err}</p>;
  if (!play) return <p className="text-center text-roast/70 py-10">Loading questions…</p>;
  const q = play.questions[i];

  return (
    <div className="relative">
      <div className={`rounded-xl px-3 py-2 text-sm font-medium mb-3 ${play.canEarn ? 'bg-sage/15 text-sage' : 'bg-latte/20 text-roast'}`}>
        {play.canEarn
          ? <>🎁 Each correct answer takes <b>{CURRENCY}{play.perCorrect} off your bill</b>. Earned so far: <b>{CURRENCY}{correct * play.perCorrect}</b></>
          : <>You've already earned your bill discount. This round is for the leaderboard.</>}
      </div>
      <div className="flex items-center justify-between text-sm text-roast/70">
        <span>Question {i + 1} / {play.questions.length}</span>
        <b className="text-espresso">{score} pts</b>
        <span className="flex gap-2">
          <button disabled={picked !== null} onClick={() => { haptic('select'); setPaused(true); }} className="px-3 py-1 rounded-full border border-latte/60 bg-white text-roast disabled:opacity-40 active:scale-95 transition">⏸ Pause</button>
          <button onClick={() => { haptic('tap'); end(); }} className="px-3 py-1 rounded-full border border-red-300 bg-white text-red-700 active:scale-95 transition">End</button>
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-latte/30 overflow-hidden"><div className="h-full bg-caramel transition-[width] duration-100" style={{ width: `${left * 10}%` }} /></div>
      <h3 key={i} className="font-display font-bold text-xl mt-4 rise">{q.q}</h3>
      <div className="mt-4 grid gap-2.5">
        {q.opts.map((t, k) => {
          const showRes = res !== null;
          const cls = showRes
            ? (k === res.correctIdx ? 'bg-sage text-foam border-sage pop' : k === picked ? 'bg-red-600 text-foam border-red-600 shake' : 'bg-white text-roast/50 border-latte/40')
            : picked === k ? 'bg-caramel/20 border-caramel scale-[.98]' : 'bg-white border-latte/50 hover:border-caramel';
          return (
            <button key={k} onPointerDown={ripple} onClick={() => answer(k)} disabled={picked !== null || paused}
              className={`relative overflow-hidden text-left px-4 py-3 rounded-2xl border-2 transition active:scale-[.98] ${cls}`}>
              {t}{showRes && k === res.correctIdx && <span className="float-right">✓</span>}
            </button>
          );
        })}
      </div>
      {paused && (
        <Overlay>
          <div className="text-5xl">⏸</div>
          <h3 className="font-display font-bold text-2xl mt-2">Paused</h3>
          <p className="text-roast/70 text-sm">The clock is stopped.</p>
          <button onPointerDown={ripple} onClick={() => { haptic('add'); setPaused(false); }} className="btn btn-primary mt-4 px-8 py-3">▶ Resume</button>
          <button onClick={() => { haptic('tap'); end(); }} className="mt-3 text-sm text-red-700 underline">End game</button>
        </Overlay>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Bean catch */
// Drawn as graphics (emoji like 🫘 don't render on many phones).
function BeanSvg({ kind }) {
  const fill = kind === 'gold' ? '#F2B632' : kind === 'burnt' ? '#1b1008' : '#6b3f24';
  const line = kind === 'gold' ? '#fff3c4' : kind === 'burnt' ? '#5a4636' : '#c68a5b';
  return (
    <svg viewBox="0 0 48 48" width="46" height="46" className="pointer-events-none drop-shadow-md" aria-hidden="true">
      {kind === 'gold' && <circle cx="24" cy="24" r="22" fill="#F2B632" opacity=".25" />}
      <ellipse cx="24" cy="24" rx="12" ry="18" transform="rotate(32 24 24)" fill={fill} stroke={kind === 'gold' ? '#c98a0a' : '#2a170b'} strokeWidth="2" />
      <path d="M15 11c9 8 9 18 18 26" stroke={line} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      {kind === 'burnt' && <path d="M36 6c-4 4 1 6-2 11 5-1 8-6 2-11Z" fill="#f97316" />}
    </svg>
  );
}
const KINDS = { bean: { v: 1, w: 0.74, color: '#E8B27D' }, gold: { v: 5, w: 0.1, color: '#F2B632' }, burnt: { v: -3, w: 0.16, color: '#ef4444' } };

function BeanCatch({ onFinish }) {
  const [beans, setBeans] = useState([]);
  const [fx, setFx] = useState([]);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(20);
  const [paused, setPaused] = useState(false);
  const [bad, setBad] = useState(0);
  const id = useRef(0);
  const scoreRef = useRef(0);
  const pausedRef = useRef(false);
  const done = useRef(false);
  const box = useRef(null);

  useEffect(() => {
    const spawn = setInterval(() => {
      if (pausedRef.current) return;
      const r = Math.random(); let acc = 0; let kind = 'bean';
      for (const [k, d] of Object.entries(KINDS)) { acc += d.w; if (r <= acc) { kind = k; break; } }
      setBeans((bs) => [...bs, { id: ++id.current, x: Math.random() * 82, kind, dur: 1.8 + Math.random() * 1.2 }]);
    }, 520);
    const tick = setInterval(() => { if (!pausedRef.current) setLeft((l) => l - 1); }, 1000);
    return () => { clearInterval(spawn); clearInterval(tick); };
  }, []);

  function end() {
    if (done.current) return;
    done.current = true;
    onFinish(Math.max(0, scoreRef.current), {});
  }
  useEffect(() => { if (left <= 0) end(); /* eslint-disable-next-line */ }, [left]);

  function togglePause(p) { pausedRef.current = p; setPaused(p); haptic('select'); }

  function catchBean(b, e) {
    const d = KINDS[b.kind];
    haptic(d.v < 0 ? 'error' : d.v > 1 ? 'add' : 'tap');
    scoreRef.current += d.v; setScore(scoreRef.current);
    const br = e.currentTarget.getBoundingClientRect(), cr = box.current.getBoundingClientRect();
    const f = { id: ++id.current, x: br.left - cr.left + br.width / 2, y: br.top - cr.top + br.height / 2, v: d.v, color: d.color };
    setFx((a) => [...a, f]);
    setTimeout(() => setFx((a) => a.filter((z) => z.id !== f.id)), 750);
    if (d.v < 0) setBad((n) => n + 1);
    setBeans((bs) => bs.filter((x) => x.id !== b.id));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm text-roast/70">
        <span><b className="text-espresso">{score} pts</b> · {Math.max(0, left)}s</span>
        <span className="flex gap-2">
          <button onClick={() => togglePause(!paused)} className="px-3 py-1 rounded-full border border-latte/60 bg-white text-roast active:scale-95 transition">{paused ? '▶ Resume' : '⏸ Pause'}</button>
          <button onClick={() => { haptic('tap'); end(); }} className="px-3 py-1 rounded-full border border-red-300 bg-white text-red-700 active:scale-95 transition">End</button>
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1 text-xs text-roast/60">
        <span className="inline-flex items-center gap-1"><svg viewBox="0 0 48 48" width="16" height="16"><ellipse cx="24" cy="24" rx="12" ry="18" transform="rotate(32 24 24)" fill="#6b3f24" /></svg>+1</span>
        <span className="inline-flex items-center gap-1"><svg viewBox="0 0 48 48" width="16" height="16"><ellipse cx="24" cy="24" rx="12" ry="18" transform="rotate(32 24 24)" fill="#F2B632" /></svg>+5</span>
        <span className="inline-flex items-center gap-1"><svg viewBox="0 0 48 48" width="16" height="16"><ellipse cx="24" cy="24" rx="12" ry="18" transform="rotate(32 24 24)" fill="#1b1008" /></svg>−3 (avoid)</span>
      </div>

      <div ref={box} className="relative mt-3 h-80 rounded-2xl overflow-hidden bg-gradient-to-b from-espresso to-roast select-none" style={{ touchAction: 'manipulation' }}>
        {left > 0 && beans.map((b) => (
          <button key={b.id} aria-label={b.kind === 'burnt' ? 'burnt bean' : 'bean'} className="bean"
            style={{ left: `${b.x}%`, animationDuration: `${b.dur}s`, animationPlayState: paused ? 'paused' : 'running' }}
            onPointerDown={(e) => { e.preventDefault(); if (!paused) catchBean(b, e); }}
            onAnimationEnd={() => setBeans((bs) => bs.filter((x) => x.id !== b.id))}>
            <BeanSvg kind={b.kind} />
          </button>
        ))}
        {fx.map((f) => (
          <span key={f.id}>
            <span className="catch-ring" style={{ left: f.x, top: f.y, color: f.color }} />
            <span className="pop-score" style={{ left: f.x, top: f.y, color: f.color }}>{f.v > 0 ? `+${f.v}` : f.v}</span>
          </span>
        ))}
        {bad > 0 && <span key={bad} className="flash-bad" />}
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-caramel/70" />
        {paused && (
          <div className="absolute inset-0 z-10 bg-espresso/95 flex flex-col items-center justify-center text-foam text-center pop">
            <div className="text-5xl">⏸</div>
            <h3 className="font-display font-bold text-2xl mt-2">Paused</h3>
            <button onPointerDown={ripple} onClick={() => togglePause(false)} className="btn btn-primary mt-4 px-8 py-3">▶ Resume</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Card */
export default function WaitGames({ token, phone, table }) {
  const [game, setGame] = useState('trivia');
  const [phase, setPhase] = useState('idle'); // idle | play | over
  const [result, setResult] = useState(0);
  const [info, setInfo] = useState({});
  const [board, setBoard] = useState([]);
  const [rm, setRm] = useState(false);

  const loadBoard = useCallback(async (g) => {
    try { const r = await fetch(`/api/scores?game=${g}`, { cache: 'no-store' }); if (r.ok) setBoard(await r.json()); } catch {}
  }, []);
  useEffect(() => { setRm(reducedMotion()); }, []);
  useEffect(() => { loadBoard(game); }, [game, loadBoard]);

  async function finish(score, extra = {}) {
    setResult(score); setInfo(extra); setPhase('over'); haptic('success');
    try {
      const r = await post('/api/scores', { token, game, score });
      if (r.ok) setBoard(await r.json()); else loadBoard(game);
    } catch {}
  }
  const switchGame = (g) => { if (phase === 'play') return; haptic('select'); setGame(g); setPhase('idle'); };
  const rank = board.findIndex((b) => b.table === String(table)) + 1;

  return (
    <section className="w-full max-w-lg bg-foam text-espresso rounded-3xl shadow-2xl overflow-hidden text-left">
      <div className="bg-espresso text-foam px-6 py-4">
        <h2 className="font-display font-bold text-xl">While you wait 🎮</h2>
        <p className="text-sm text-latte">Play and put Table {table} on today's leaderboard.</p>
      </div>
      <div className="p-6">
        <div className="flex gap-2">
          {[['trivia', '🧠 Coffee trivia'], ['catch', '☕ Bean catch']].map(([k, label]) => (
            <button key={k} onClick={() => switchGame(k)} className={`flex-1 rounded-full py-2.5 text-sm border transition active:scale-95 ${game === k ? 'bg-espresso text-foam border-espresso' : 'bg-white text-roast border-latte/50'} ${phase === 'play' && game !== k ? 'opacity-40' : ''}`}>{label}</button>
          ))}
        </div>

        <div className="mt-5">
          {phase === 'idle' && (
            <div className="text-center py-6 rise">
              <div className="text-6xl float">{game === 'trivia' ? '🧠' : '☕'}</div>
              {game === 'trivia' ? (
                <p className="mt-3 text-roast/80">5 quick questions. <b>Every correct answer takes {CURRENCY}{QUIZ_OFF} off your bill</b> (up to {CURRENCY}{QUIZ_OFF * 5}, once per guest). Faster answers also score more on the leaderboard.</p>
              ) : (
                <p className="mt-3 text-roast/80">Catch the falling beans for 20 seconds. Golden beans are worth 5, burnt ones cost you 3.</p>
              )}
              {game === 'catch' && rm ? (
                <p className="mt-4 text-sm text-roast/70">Bean catch is switched off because your device asks for reduced motion. Try the trivia!</p>
              ) : (
                <button onPointerDown={ripple} onClick={() => { haptic('add'); setPhase('play'); }} className="btn btn-primary mt-5 px-8 py-3.5">Play</button>
              )}
            </div>
          )}
          {phase === 'play' && (game === 'trivia' ? <Trivia token={token} phone={phone} onFinish={finish} /> : <BeanCatch onFinish={finish} />)}
          {phase === 'over' && (
            <div className="text-center py-6 pop">
              <div className="text-6xl">🏆</div>
              <h3 className="font-display font-bold text-3xl mt-2">{result} points</h3>
              <p className="text-roast/80">{rank ? `Table ${table} is #${rank} today` : 'Nice game!'}</p>
              {game === 'trivia' && info.total && (
                <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${info.discount > 0 ? 'bg-sage/15 text-sage' : 'bg-latte/20 text-roast'}`}>
                  {info.correctCount}/{info.total} correct.{' '}
                  {info.discount > 0
                    ? <b>🎉 {CURRENCY}{info.discount} off has been added to your bill!</b>
                    : info.canEarn ? 'No correct answers this time, so no discount. Try again!' : "You've already earned your bill discount."}
                </div>
              )}
              <button onPointerDown={ripple} onClick={() => { haptic('add'); setPhase('play'); }} className="btn btn-primary mt-5 px-8 py-3.5">Play again</button>
            </div>
          )}
        </div>

        <div className="mt-6 pt-5 border-t border-latte/40">
          <h3 className="font-semibold">Today's top tables</h3>
          {board.length === 0 ? (
            <p className="text-sm text-roast/60 mt-2">No scores yet. Be the first!</p>
          ) : (
            <ol className="mt-2 space-y-1.5">
              {board.slice(0, 5).map((b, k) => (
                <li key={b.table} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${b.table === String(table) ? 'bg-caramel/15 font-bold' : 'bg-cream'}`}>
                  <span className="w-6 text-center">{['🥇', '🥈', '🥉'][k] || k + 1}</span>
                  <span className="flex-1">Table {b.table}{b.table === String(table) && ' (you)'}</span>
                  <span>{b.score}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

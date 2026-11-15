'use client';
import { useEffect, useRef } from 'react';

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Haptic feedback (Android Chrome; silently ignored where unsupported, e.g. iOS Safari).
const PATTERNS = { tap: 8, select: 12, add: [12, 40, 18], success: [20, 50, 20, 50, 60], error: [60, 40, 60], scan: [30, 30, 80] };
export function haptic(kind = 'tap') {
  try {
    if (reducedMotion()) return;
    navigator.vibrate?.(PATTERNS[kind] ?? kind);
  } catch {}
}

// Click ripple for any element: <button onPointerDown={ripple}>
export function ripple(e) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const d = Math.max(r.width, r.height);
  const s = document.createElement('span');
  s.className = 'ripple';
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  el.appendChild(s);
  setTimeout(() => s.remove(), 650);
}

// Fade/slide elements in as they scroll into view.
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  });
}

// Subtle 3D tilt on pointer move (mouse only).
export const tiltHandlers = {
  onPointerMove(e) {
    if (e.pointerType !== 'mouse' || reducedMotion()) return;
    const el = e.currentTarget, r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
  },
  onPointerLeave(e) { e.currentTarget.style.transform = ''; },
};

export function burstConfetti(n = 36) {
  if (reducedMotion()) return;
  const colors = ['#B5703A', '#C9A27E', '#5E7358', '#F7F0E6', '#8a4f2a'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    s.className = 'confetti';
    s.style.cssText = `left:${Math.random() * 100}vw;background:${colors[i % colors.length]};animation-duration:${2 + Math.random() * 2}s;animation-delay:${Math.random() * 0.6}s`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 4800);
  }
}

export function useCountUp(target, ref, decimals = 0, ms = 1400) {
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const run = () => {
      if (done.current) return;
      done.current = true;
      if (reducedMotion()) { el.textContent = target.toFixed(decimals); return; }
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / ms);
        el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(decimals);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(([e]) => e.isIntersecting && run(), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, ref, decimals, ms]);
}

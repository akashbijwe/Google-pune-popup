// Shared brand bits used by every page so the look stays consistent.

export function PhotoBg({ src = '/img/tw-2.jpg', mobileSrc, pos = 'center', animate = true, light = false, soft = false }) {
  return (
    <div className={`photo-bg ${light ? 'light' : ''} ${soft ? 'soft' : ''}`} aria-hidden="true">
      <picture>
        {mobileSrc && <source media="(max-width: 639px)" srcSet={mobileSrc} />}
        <img src={src} alt="" className={animate ? 'ken-burns' : ''} style={{ objectPosition: pos }} />
      </picture>
    </div>
  );
}

export function CupMark({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path d="M6 20h30v6a15 15 0 0 1-15 15h0A15 15 0 0 1 6 26v-6Z" fill="currentColor" />
      <path d="M36 22h2.5a4.5 4.5 0 0 1 0 9H35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 26c5 4 11 5 18 1" stroke="#2E1F17" strokeWidth="2.4" strokeLinecap="round" opacity=".55" />
      <path className="steam" d="M14 14c-2-3 2-4 0-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="steam" style={{ animationDelay: '.8s' }} d="M22 14c-2-3 2-4 0-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="steam" style={{ animationDelay: '1.5s' }} d="M30 14c-2-3 2-4 0-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function QrIcon({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M14 14h3v3m4 0v4h-4m-3-1v1m0-4v0" />
    </svg>
  );
}

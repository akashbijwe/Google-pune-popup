'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CAFE_NAME, OUTLET, INFO } from '@/lib/brand';
import { haptic, ripple, tiltHandlers, useCountUp, useReveal } from '@/lib/fx';
import { CupMark, PhotoBg, QrIcon } from './components/Brand';
import { ScanButton } from './components/Scanner';
import SiteNav from './components/SiteNav';

const GALLERY = [
  ['/img/tw-7.jpg', 'Our Balewadi Highstreet storefront'],
  ['/img/tw-6.jpg', 'Just brew it'],
  ['/img/tw-10.jpg', 'Croissant, nachos and cold coffees'],
  ['/img/tw-9.jpg', 'The coffee bar'],
  ['/img/tw-11.jpg', 'Layered iced coffee'],
  ['/img/tw-3.jpg', 'Beans and bakes at the counter'],
  ['/img/tw-5.jpg', 'Inside the cafe'],
  ['/img/tw-4.jpg', 'Cheesy garlic bread'],
];

const HIGHLIGHTS = [
  ['/img/tw-2.jpg', 'Handcrafted coffee', 'Hot chocolates and lattes poured with care, paired with a fresh croissant or a loaded bagel.'],
  ['/img/tw-11.jpg', 'Cold & iced', 'Layered iced coffees and thick cold shakes for when Pune gets warm.'],
  ['/img/tw-4.jpg', 'Bites that stay', 'Cheesy garlic bread, nachos and bakes, made to go with your cup.'],
];

const STEPS = [
  ['Scan', 'Tap “Scan menu” and point your phone at the QR code on your table.'],
  ['Verify', 'Enter your mobile number and the 6-digit OTP.'],
  ['Sip', 'Pick your drinks and bites. We bring them to your table.'],
];

function OpenNow() {
  const [open, setOpen] = useState(null);
  useEffect(() => {
    const h = +new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date());
    setOpen(h >= INFO.openHour && h < INFO.closeHour);
  }, []);
  if (open === null) return null;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${open ? 'bg-sage/25 text-green-200' : 'bg-red-900/40 text-red-200'}`}>
      <span className={`w-2 h-2 rounded-full ${open ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      {open ? 'Open now' : 'Closed now'}
    </span>
  );
}

function Rating() {
  const r = useRef(null);
  useCountUp(INFO.rating, r, 1);
  return (
    <div className="flex items-center gap-3">
      <span ref={r} className="font-display text-5xl font-bold text-foam">0.0</span>
      <div>
        <div className="text-latte text-xl tracking-widest" aria-label={`${INFO.rating} out of 5 stars`}>★★★★★</div>
        <div className="text-foam/70 text-sm">{INFO.reviews} Google reviews</div>
      </div>
    </div>
  );
}

export default function Home() {
  useReveal();
  const hero = useRef(null);
  useEffect(() => {
    const on = () => { if (hero.current) hero.current.style.transform = `translateY(${Math.min(window.scrollY, 600) * 0.25}px)`; };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <>
      <PhotoBg src="/img/tw-2.jpg" mobileSrc="/img/tw-10.jpg" pos="center 70%" soft />
      <SiteNav links={[['#story', 'Our story'], ['/quiz', 'Coffee quiz'], ['#gallery', 'Gallery'], ['#how', 'How it works'], ['#visit', 'Visit us']]} />

      <main className="text-foam">
        {/* ---------- Hero ---------- */}
        <section className="min-h-[100svh] flex items-start sm:items-center px-5 sm:px-6 pt-24 sm:pt-20">
          <div ref={hero} className="max-w-6xl mx-auto w-full">
            <div className="rise" style={{ '--d': '100ms' }}><OpenNow /></div>
            <p className="rise mt-4 text-latte tracking-[.3em] text-xs sm:text-sm uppercase font-semibold" style={{ '--d': '200ms' }}>{OUTLET} · Pune</p>
            <h1 className="rise font-display font-bold text-5xl sm:text-7xl lg:text-8xl leading-[1.02] mt-3 max-w-3xl drop-shadow-lg" style={{ '--d': '300ms' }}>
              Just <span className="italic text-latte">brew</span> it.
            </h1>
            <p className="rise hidden sm:block mt-5 max-w-xl text-lg sm:text-xl text-foam/85" style={{ '--d': '450ms' }}>
              Welcome to {CAFE_NAME}. Great coffee, fresh bites and a warm corner of Balewadi High Street to enjoy them in.
            </p>
            <div className="rise mt-8 flex flex-wrap gap-3" style={{ '--d': '600ms' }}>
              <ScanButton className="btn btn-primary px-7 py-4 text-base sm:text-lg">
                <QrIcon className="w-6 h-6" /> Scan to see the menu
              </ScanButton>
              <a href="#visit" onPointerDown={ripple} onClick={() => haptic('tap')} className="btn btn-ghost px-7 py-4 text-base sm:text-lg">Find us</a>
            </div>
            <div className="rise hidden sm:flex mt-12 items-center gap-3 text-sm text-foam/70" style={{ '--d': '800ms' }}>
              <span className="float inline-block">↓</span> Seated at a table? Scan the QR on it to order.
            </div>
          </div>
        </section>

        {/* ---------- Story ---------- */}
        <section id="story" className="px-5 sm:px-6 py-20 sm:py-28 bg-espresso/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="reveal max-w-2xl">
              <p className="text-latte tracking-[.3em] text-xs uppercase font-semibold">Brewing happiness in a cup</p>
              <h2 className="font-display font-bold text-4xl sm:text-5xl mt-3">Coffee, the third-wave way</h2>
              <p className="mt-4 text-foam/80 text-lg">
                Third Wave Coffee is all about coffee made with attention, from the roast to the pour. Our {OUTLET} cafe is a place to meet, work or simply slow down.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {HIGHLIGHTS.map(([img, title, text], i) => (
                <article key={title} {...tiltHandlers} style={{ '--d': `${i * 120}ms` }} className="tilt reveal group rounded-3xl overflow-hidden bg-foam/10 border border-foam/15 shadow-xl">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={img} alt={title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display font-bold text-2xl">{title}</h3>
                    <p className="mt-2 text-foam/75">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Quiz promo ---------- */}
        <section id="quiz" className="px-5 sm:px-6 py-16 sm:py-24 bg-espresso/90">
          <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2 items-center">
            <div className="reveal">
              <p className="text-latte tracking-[.3em] text-xs uppercase font-semibold">Three taps</p>
              <h2 className="font-display font-bold text-4xl sm:text-5xl mt-3">What's your coffee personality?</h2>
              <p className="mt-4 text-foam/80 text-lg">Rainy or sunny? Sweet or bitter? Work or chill? Find the drink that fits you and share your card.</p>
              <Link href="/quiz" onPointerDown={ripple} onClick={() => haptic('tap')} className="btn btn-primary mt-7 px-7 py-4 text-lg">Take the quiz →</Link>
            </div>
            <div className="reveal rounded-3xl overflow-hidden border border-foam/15 shadow-2xl" style={{ '--d': '150ms' }}>
              <img src="/img/tw-11.jpg" alt="Layered iced coffee" loading="lazy" className="w-full aspect-[4/3] object-cover" />
            </div>
          </div>
        </section>

        {/* ---------- Gallery marquee ---------- */}
        <section id="gallery" className="py-16 sm:py-24 overflow-hidden bg-espresso/90">
          <div className="reveal px-5 sm:px-6 max-w-6xl mx-auto mb-8">
            <p className="text-latte tracking-[.3em] text-xs uppercase font-semibold">A look inside</p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl mt-3">Pull up a chair</h2>
          </div>
          <div className="marquee gap-4 pl-4">
            {[...GALLERY, ...GALLERY].map(([src, alt], i) => (
              <figure key={i} className="shrink-0 w-64 sm:w-80 aspect-[4/5] rounded-3xl overflow-hidden border border-foam/15 mr-4">
                <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </figure>
            ))}
          </div>
        </section>

        {/* ---------- How ordering works ---------- */}
        <section id="how" className="px-5 sm:px-6 py-20 sm:py-28 bg-espresso/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="reveal max-w-2xl">
              <p className="text-latte tracking-[.3em] text-xs uppercase font-semibold">Order from your seat</p>
              <h2 className="font-display font-bold text-4xl sm:text-5xl mt-3">Scan. Verify. Sip.</h2>
            </div>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map(([t, d], i) => (
                <li key={t} {...tiltHandlers} style={{ '--d': `${i * 120}ms` }} className="tilt reveal glass rounded-3xl p-7">
                  <span className="font-display text-6xl font-bold text-latte/80">{i + 1}</span>
                  <h3 className="font-display font-bold text-2xl mt-2">{t}</h3>
                  <p className="mt-2 text-foam/80">{d}</p>
                </li>
              ))}
            </ol>
            <div className="reveal mt-10">
              <ScanButton className="btn btn-primary px-7 py-4 text-lg"><QrIcon className="w-6 h-6" /> Scan menu</ScanButton>
            </div>
          </div>
        </section>

        {/* ---------- Visit ---------- */}
        <section id="visit" className="px-5 sm:px-6 py-20 sm:py-28 bg-espresso/85">
          <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-2 items-center">
            <div className="reveal">
              <p className="text-latte tracking-[.3em] text-xs uppercase font-semibold">Visit us</p>
              <h2 className="font-display font-bold text-4xl sm:text-5xl mt-3">{OUTLET}</h2>
              <dl className="mt-6 space-y-5 text-foam/90">
                <div><dt className="text-xs uppercase tracking-widest text-latte">Address</dt><dd className="mt-1">{INFO.address}</dd></div>
                <div><dt className="text-xs uppercase tracking-widest text-latte">Hours</dt><dd className="mt-1">{INFO.hours}</dd></div>
                <div><dt className="text-xs uppercase tracking-widest text-latte">Phone</dt><dd className="mt-1"><a href={INFO.phoneHref} className="underline decoration-latte underline-offset-4 hover:text-latte">{INFO.phone}</a></dd></div>
              </dl>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={INFO.mapsUrl} target="_blank" rel="noreferrer" onPointerDown={ripple} onClick={() => haptic('tap')} className="btn btn-primary px-6 py-3.5">Get directions ↗</a>
                <a href={INFO.phoneHref} onPointerDown={ripple} onClick={() => haptic('tap')} className="btn btn-ghost px-6 py-3.5">Call us</a>
              </div>
            </div>
            <div className="reveal" style={{ '--d': '150ms' }}>
              <div className="relative rounded-3xl overflow-hidden border border-foam/15 shadow-2xl">
                <img src="/img/tw-1.jpg" alt="Third Wave Coffee storefront at night" loading="lazy" className="w-full aspect-[4/3] object-cover object-top" />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-espresso/95 to-transparent"><Rating /></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-espresso text-foam/70 px-5 sm:px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-2 text-foam"><CupMark className="w-7 h-7 text-latte" /><span className="font-display font-bold">{CAFE_NAME}</span></div>
          <p className="text-sm">© {new Date().getFullYear()} {CAFE_NAME} · {OUTLET}, Pune</p>
          <Link href="/admin" onClick={() => haptic('tap')} className="text-sm hover:text-latte">Staff login</Link>
        </div>
      </footer>
    </>
  );
}

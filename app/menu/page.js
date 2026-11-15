'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CAFE_NAME, OUTLET, CURRENCY } from '@/lib/brand';
import { haptic, ripple, burstConfetti } from '@/lib/fx';
import { PhotoBg, QrIcon } from '../components/Brand';
import { ScanButton } from '../components/Scanner';
import SiteNav from '../components/SiteNav';
import PhoneGate from '../components/PhoneGate';
import MyOrders from '../components/MyOrders';
import { notifySession } from '@/lib/session';

const SIZES = { S: 'Small', M: 'Medium', L: 'Large' };

function unitPrice(item, sel, opts) {
  if (item.type === 'food') return item.price;
  let p = item.prices[sel.size];
  if (item.milk) p += opts.milk.find((m) => m.name === sel.milk)?.price || 0;
  if (item.shot && sel.extraShot) p += opts.extraShotPrice;
  return p;
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onPointerDown={ripple}
      onClick={() => { haptic('select'); onClick(); }}
      className={`relative overflow-hidden shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm border transition active:scale-95 ${
        active ? 'bg-espresso text-foam border-espresso shadow-md' : 'bg-foam text-roast border-latte/50 hover:border-roast'
      }`}
    >
      {children}
    </button>
  );
}

const Label = ({ children }) => (
  <h3 className="mt-6 mb-2 text-xs font-semibold tracking-widest text-roast/70 uppercase">{children}</h3>
);

function Customizer({ item, opts, onClose, onAdd }) {
  const [sel, setSel] = useState({
    size: 'M', sugar: 'Regular', milk: 'Regular milk', extraShot: false, qty: 1, note: '',
  });
  const set = (k, v) => setSel((s) => ({ ...s, [k]: v }));
  const total = unitPrice(item, sel, opts) * sel.qty;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/60 backdrop-blur-sm fade-in" onClick={onClose}>
      <div
        className="slide-up w-full max-w-lg max-h-[92vh] overflow-y-auto bg-cream rounded-t-3xl p-6 pb-28 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => { haptic('tap'); onClose(); }} className="absolute right-5 top-5 w-9 h-9 rounded-full bg-foam text-roast active:scale-90 transition" aria-label="Close">✕</button>
        <div className="text-6xl pop">{item.emoji}</div>
        <h2 className="font-display font-bold text-3xl mt-2">{item.name}</h2>
        <p className="text-roast/80 mt-1">{item.desc}</p>

        {item.type === 'beverage' && (
          <>
            <Label>Size</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(SIZES).map(([k, label]) => (
                <button
                  key={k}
                  onPointerDown={ripple}
                  onClick={() => { haptic('select'); set('size', k); }}
                  className={`relative overflow-hidden rounded-2xl py-3 border text-center transition active:scale-95 ${
                    sel.size === k ? 'bg-espresso text-foam border-espresso shadow-md' : 'bg-foam border-latte/50'
                  }`}
                >
                  <div className="font-semibold">{label}</div>
                  <div className="text-xs opacity-70">{CURRENCY}{item.prices[k]}</div>
                </button>
              ))}
            </div>

            {item.sugar && (
              <>
                <Label>Sugar</Label>
                <div className="flex flex-wrap gap-2">
                  {opts.sugar.map((s) => (
                    <Chip key={s} active={sel.sugar === s} onClick={() => set('sugar', s)}>{s}</Chip>
                  ))}
                </div>
              </>
            )}
            {item.milk && (
              <>
                <Label>Milk</Label>
                <div className="flex flex-wrap gap-2">
                  {opts.milk.map((m) => (
                    <Chip key={m.name} active={sel.milk === m.name} onClick={() => set('milk', m.name)}>
                      {m.name}{m.price ? ` +${CURRENCY}${m.price}` : ''}
                    </Chip>
                  ))}
                </div>
              </>
            )}
            {item.shot && (
              <>
                <Label>Add-ons</Label>
                <Chip active={sel.extraShot} onClick={() => set('extraShot', !sel.extraShot)}>
                  Extra espresso shot +{CURRENCY}{opts.extraShotPrice}
                </Chip>
              </>
            )}
          </>
        )}

        <Label>Special request</Label>
        <input
          value={sel.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="e.g. less ice, extra spicy…"
          className="w-full rounded-2xl bg-foam border border-latte/50 px-4 py-3 outline-none focus:border-caramel transition"
        />

        <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none">
          <div className="w-full max-w-lg bg-cream/95 backdrop-blur p-4 flex items-center gap-3 pointer-events-auto border-t border-latte/40">
            <div className="flex items-center bg-foam rounded-full border border-latte/50">
              <button className="w-10 h-10 text-xl active:scale-75 transition" aria-label="Decrease" onClick={() => { haptic('tap'); set('qty', Math.max(1, sel.qty - 1)); }}>−</button>
              <span key={sel.qty} className="w-8 text-center font-semibold bump">{sel.qty}</span>
              <button className="w-10 h-10 text-xl active:scale-75 transition" aria-label="Increase" onClick={() => { haptic('tap'); set('qty', Math.min(20, sel.qty + 1)); }}>+</button>
            </div>
            <button
              onPointerDown={ripple}
              onClick={() => { haptic('add'); onAdd({ ...sel, itemId: item.id, unit: unitPrice(item, sel, opts) }); }}
              className="btn btn-dark flex-1 py-3 shadow-lg"
            >
              Add to order · {CURRENCY}{total}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function describe(item, l) {
  const parts = [];
  if (l.size) parts.push(SIZES[l.size]);
  if (item.sugar) parts.push(l.sugar);
  if (item.milk) parts.push(l.milk);
  if (l.extraShot) parts.push('Extra shot');
  if (l.note) parts.push(`“${l.note}”`);
  return parts.join(' · ');
}

function MenuInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [table, setTable] = useState(null); // null = checking, '' = no valid table
  const [token, setToken] = useState('');
  const [phone, setPhone] = useState('');
  const [badCode, setBadCode] = useState(false);
  const [menu, setMenu] = useState(null);
  const [cat, setCat] = useState(null);
  const [custom, setCustom] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');
  const [bumpKey, setBumpKey] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    fetch('/api/menu').then((r) => r.json()).then((m) => { setMenu(m); setCat(m.categories[0]); });
  }, []);

  // Validate the encrypted table code (from the scanned URL, or earlier in this session).
  useEffect(() => {
    const fromUrl = params.get('table');
    const stored = sessionStorage.getItem('twc_token');
    const t = fromUrl || stored;
    if (!t) { setTable(''); return; }
    let live = true;
    fetch(`/api/table?t=${encodeURIComponent(t)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ table: n }) => {
        if (!live) return;
        if (fromUrl && fromUrl !== stored) sessionStorage.removeItem('twc_phone'); // new scan → verify again
        sessionStorage.setItem('twc_token', t);
        setToken(t); setTable(n); setBadCode(false);
        setPhone(sessionStorage.getItem('twc_phone') || '');
        notifySession();
      })
      .catch(() => {
        if (!live) return;
        sessionStorage.removeItem('twc_token');
        notifySession();
        setTable(''); setToken(''); setBadCode(!!fromUrl);
        if (fromUrl) haptic('error');
      });
    return () => { live = false; };
  }, [params]);

  const itemOf = (id) => menu.items.find((i) => i.id === id);
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const total = cart.reduce((s, l) => s + l.unit * l.qty, 0);

  const grouped = useMemo(() => {
    if (!menu) return [];
    return menu.categories
      .map((c) => ({ c, items: menu.items.filter((i) => i.category === c && i.available) }))
      .filter((g) => g.items.length);
  }, [menu]);

  function say(m) { setToast(m); setTimeout(() => setToast(''), 1700); }
  function scrollTo(c) {
    setCat(c);
    document.getElementById('cat-' + c)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function place() {
    setPlacing(true); setErr('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, phone, items: cart }),
      });
      const data = await res.json();
      if (!res.ok) { haptic('error'); setErr(data.error || 'Something went wrong'); setPlacing(false); return; }
      haptic('success'); burstConfetti(24);
      setCart([]);
      router.push(`/order-placed?n=${String(data.number).padStart(3, '0')}&table=${data.table}&total=${data.total}`);
    } catch {
      haptic('error'); setErr('Network error. Please try again.'); setPlacing(false);
    }
  }

  if (!menu || table === null)
    return (
      <>
        <PhotoBg src="/img/tw-9.jpg" />
        <main className="min-h-screen flex flex-col items-center justify-center text-foam gap-4">
          <div className="text-5xl float">☕</div>
          <p className="font-display italic text-xl">Brewing the menu…</p>
        </main>
      </>
    );

  const canOrder = !!table && !!phone;

  return (
    <>
      <PhotoBg src="/img/tw-9.jpg" light animate={false} />
      <SiteNav />

      {table && !phone && (
        <PhoneGate table={table} onVerified={(p) => { sessionStorage.setItem('twc_phone', p); setPhone(p); notifySession(); say('Phone verified. Welcome!'); }} />
      )}

      <main className="pb-40">
        <header className="relative text-foam overflow-hidden rounded-b-[2.5rem] sm:rounded-b-[3.5rem]">
          <img src="/img/tw-3.jpg" alt="" className="absolute inset-0 w-full h-full object-cover ken-burns" />
          <div className="absolute inset-0 bg-gradient-to-b from-espresso/85 via-espresso/70 to-espresso/90" />
          <div className="relative max-w-5xl mx-auto px-5 sm:px-6 pt-28 pb-12">
            {table ? (
              <div className="rise inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs tracking-widest uppercase font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Table {table}{phone && ` · +91 ${phone}`}
              </div>
            ) : (
              <div className="rise inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs tracking-widest uppercase font-semibold">Browsing the menu</div>
            )}
            <h1 className="rise font-display font-bold text-4xl sm:text-6xl mt-4" style={{ '--d': '100ms' }}>{CAFE_NAME}</h1>
            <p className="rise font-display italic text-latte text-lg sm:text-xl mt-1" style={{ '--d': '200ms' }}>{OUTLET} · Just brew it.</p>
          </div>
        </header>

        {!table && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-5">
            <div className={`rounded-3xl border p-5 flex flex-wrap items-center gap-4 justify-between rise ${badCode ? 'bg-red-50 border-red-300 shake' : 'bg-foam border-latte/40'}`}>
              <div>
                <div className="font-display font-bold text-xl">{badCode ? "That table code isn't valid" : 'Want to order?'}</div>
                <p className="text-sm text-roast/80">{badCode ? 'Please scan the QR code on your table again.' : 'You can browse freely. Scan the QR code on your table to place an order.'}</p>
              </div>
              <ScanButton className="btn btn-primary px-6 py-3"><QrIcon /> Scan table QR</ScanButton>
            </div>
          </div>
        )}

        <nav className="sticky top-16 z-30 mt-4 bg-cream/90 backdrop-blur border-b border-latte/30">
          <div className="max-w-5xl mx-auto flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
            {grouped.map((g) => (
              <Chip key={g.c} active={cat === g.c} onClick={() => scrollTo(g.c)}>{g.c}</Chip>
            ))}
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {grouped.map((g) => (
            <section key={g.c} id={'cat-' + g.c} className="pt-8 scroll-mt-32">
              <h2 className="font-display font-bold text-2xl sm:text-3xl mb-4">{g.c}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {g.items.map((it) => (
                  <button
                    key={it.id}
                    onPointerDown={ripple}
                    onClick={() => { haptic('tap'); setCustom(it); }}
                    className="group relative overflow-hidden w-full text-left flex items-center gap-4 bg-foam rounded-3xl p-4 border border-latte/30 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[.98] transition"
                  >
                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-latte/40 to-caramel/20 flex items-center justify-center text-3xl transition-transform group-hover:scale-110 group-hover:rotate-6">
                      {it.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {it.type === 'food' && (
                          <span className={`w-3 h-3 border shrink-0 ${it.veg ? 'border-green-700' : 'border-red-700'} flex items-center justify-center`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${it.veg ? 'bg-green-700' : 'bg-red-700'}`} />
                          </span>
                        )}
                        <h3 className="font-semibold truncate">{it.name}</h3>
                      </div>
                      <p className="text-sm text-roast/70 line-clamp-2">{it.desc}</p>
                      <p className="mt-1 text-sm font-semibold text-caramel">
                        {it.type === 'beverage' ? `from ${CURRENCY}${it.prices.S}` : `${CURRENCY}${it.price}`}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-espresso text-foam flex items-center justify-center text-xl transition-transform group-hover:rotate-90">+</div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        {count > 0 && !showCart && (
          <div className={`fixed ${orderCount ? 'bottom-20' : 'bottom-4'} left-0 right-0 px-4 z-40 flex justify-center pop`}>
            <button
              key={bumpKey}
              onPointerDown={ripple}
              onClick={() => { haptic('tap'); setShowCart(true); }}
              className="btn btn-dark bump w-full max-w-lg px-6 py-4 justify-between shadow-2xl"
            >
              <span>🛒 {count} item{count > 1 ? 's' : ''}</span>
              <span>View order · {CURRENCY}{total}</span>
            </button>
          </div>
        )}

        {toast && (
          <div className="toast fixed bottom-40 left-1/2 z-[65] bg-espresso text-foam rounded-full px-5 py-2.5 text-sm shadow-xl" role="status">{toast}</div>
        )}

        {canOrder && <MyOrders token={token} phone={phone} onCount={setOrderCount} />}

        {custom && (
          <Customizer
            item={custom}
            opts={menu.options}
            onClose={() => setCustom(null)}
            onAdd={(l) => { setCart((c) => [...c, l]); say(`Added ${l.qty} × ${custom.name}`); setBumpKey((k) => k + 1); setCustom(null); }}
          />
        )}

        {showCart && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/60 backdrop-blur-sm fade-in" onClick={() => setShowCart(false)}>
            <div className="slide-up w-full max-w-lg max-h-[90vh] overflow-y-auto bg-cream rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <h2 className="font-display font-bold text-3xl">Your order</h2>
                <button onClick={() => { haptic('tap'); setShowCart(false); }} className="w-9 h-9 rounded-full bg-foam text-roast active:scale-90 transition" aria-label="Close">✕</button>
              </div>
              <p className="text-sm text-roast/70">{table ? `Table ${table}` : 'No table selected'}</p>
              <div className="mt-4 divide-y divide-latte/30">
                {cart.map((l, idx) => {
                  const it = itemOf(l.itemId);
                  return (
                    <div key={idx} className="py-3 flex gap-3 fade-in">
                      <div className="text-2xl">{it.emoji}</div>
                      <div className="flex-1">
                        <div className="font-semibold">{l.qty} × {it.name}</div>
                        <div className="text-xs text-roast/70">{describe(it, l)}</div>
                        <button
                          className="text-xs text-red-700 mt-1"
                          onClick={() => { haptic('select'); setCart((c) => c.filter((_, i) => i !== idx)); }}
                        >Remove</button>
                      </div>
                      <div className="font-semibold">{CURRENCY}{l.unit * l.qty}</div>
                    </div>
                  );
                })}
              </div>
              {cart.length === 0 && <p className="py-8 text-center text-roast/60">Your cart is empty.</p>}
              <div className="flex justify-between text-lg font-semibold mt-4 pt-4 border-t border-latte/40">
                <span>Total</span><span>{CURRENCY}{total}</span>
              </div>
              {err && <p className="text-red-700 text-sm mt-3" role="alert">{err}</p>}
              {canOrder ? (
                <button
                  disabled={placing || !cart.length}
                  onPointerDown={ripple}
                  onClick={place}
                  className="btn btn-primary mt-5 w-full py-4 text-base disabled:opacity-50"
                >
                  {placing ? 'Placing order…' : 'Place order'}
                </button>
              ) : (
                <div className="mt-5">
                  <p className="text-sm text-roast/80 mb-3">Scan the QR code on your table to place this order. Your cart stays here.</p>
                  <ScanButton className="btn btn-primary w-full py-4 text-base"><QrIcon /> Scan table QR to order</ScanButton>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default function Page() {
  return <Suspense><MenuInner /></Suspense>;
}

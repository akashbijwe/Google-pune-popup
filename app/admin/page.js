'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { CAFE_NAME, CURRENCY } from '@/lib/brand';
import { haptic, ripple } from '@/lib/fx';
import { CupMark, PhotoBg } from '../components/Brand';

const api = (url, opts) => fetch(url, opts);
const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const SIZE = { S: 'Small', M: 'Medium', L: 'Large' };

/* ---------------- Login ---------------- */
function Login({ onDone }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const r = await api('/api/auth', json('POST', { username: u, password: p }));
    setBusy(false);
    if (r.ok) { haptic('success'); onDone(); }
    else { haptic('error'); setShake((n) => n + 1); setErr('Enter a username and password.'); }
  }
  const inp = 'w-full border-2 border-latte/50 bg-white rounded-xl px-4 py-3 mb-3 outline-none focus:border-caramel transition';
  return (
    <>
      <PhotoBg src="/img/tw-5.jpg" />
      <main className="min-h-screen flex items-center justify-center px-5">
        <form key={shake} onSubmit={submit} className={`w-full max-w-sm bg-foam rounded-3xl shadow-2xl p-8 pop ${shake ? 'shake' : ''}`}>
          <CupMark className="w-10 h-10 text-caramel" />
          <h1 className="font-display font-bold text-3xl mt-2">{CAFE_NAME}</h1>
          <p className="text-sm text-roast/70 mb-5">Staff panel</p>
          <input className={inp} placeholder="Username" autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} />
          <input type="password" className={inp} placeholder="Password" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} />
          <p className="text-xs rounded-xl bg-caramel/10 text-roast px-3 py-2 mb-3">
            <b>Demo mode:</b> any username and password will work.
          </p>
          {err && <p className="text-red-700 text-sm mb-3" role="alert">{err}</p>}
          <button disabled={busy} onPointerDown={ripple} className="btn btn-primary w-full py-3.5">{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </main>
    </>
  );
}

/* ---------------- Live orders (waiter) ---------------- */
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1175].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.16);
      o.start(ctx.currentTime + i * 0.18); o.stop(ctx.currentTime + i * 0.18 + 0.17);
    });
  } catch {}
}

function ago(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  return m < 1 ? 'just now' : `${m} min ago`;
}

function OrderCard({ o, onStatus }) {
  const isNew = o.status === 'new';
  return (
    <div className={`bg-white rounded-2xl border-2 p-4 shadow-sm ${isNew ? 'border-caramel' : 'border-sage'}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs text-roast/60">Order #{String(o.number).padStart(3, '0')}</div>
          <div className="text-2xl font-bold">Table {o.table}</div>
          {o.phone && <a href={`tel:+91${String(o.phone).slice(-10)}`} className="text-xs text-roast/70 underline">+91 {String(o.phone).slice(-10)}</a>}
        </div>
        <div className="text-right">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isNew ? 'bg-caramel/15 text-caramel' : 'bg-sage/15 text-sage'}`}>
            {isNew ? 'NEW' : 'PREPARED'}
          </span>
          {o.paid && <span className="ml-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800">PAID</span>}
          <div className="text-xs text-roast/60 mt-1">{ago(o.createdAt)}</div>
        </div>
      </div>
      <ul className="mt-3 space-y-2 border-t border-dashed border-latte/50 pt-3">
        {o.items.map((i, k) => (
          <li key={k} className="text-sm">
            <b>{i.qty} × {i.name}</b>
            <div className="text-xs text-roast/70">
              {[i.size && SIZE[i.size], i.sugar, i.milk, i.extraShot && 'Extra shot'].filter(Boolean).join(' · ')}
            </div>
            {i.note && <div className="text-xs text-red-700">Note: {i.note}</div>}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-semibold">{CURRENCY}{o.total}</span>
        {isNew ? (
          <button onPointerDown={ripple} onClick={() => { haptic('select'); onStatus(o.id, 'prepared'); }} className="relative overflow-hidden active:scale-95 transition bg-caramel text-white rounded-lg px-4 py-2 text-sm font-medium">Mark prepared</button>
        ) : (
          <button onPointerDown={ripple} onClick={() => { haptic('success'); onStatus(o.id, 'served'); }} className="relative overflow-hidden active:scale-95 transition bg-sage text-white rounded-lg px-4 py-2 text-sm font-medium">Served to customer</button>
        )}
      </div>
    </div>
  );
}

function LiveOrders() {
  const [orders, setOrders] = useState([]);
  const seen = useRef(null);
  const load = useCallback(async () => {
    const r = await api('/api/orders?scope=active', { cache: 'no-store' });
    if (!r.ok) return;
    const data = await r.json();
    const ids = new Set(data.map((o) => o.id));
    if (seen.current && data.some((o) => !seen.current.has(o.id))) beep();
    seen.current = ids;
    setOrders(data);
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, [load]);

  async function setStatus(id, status) {
    await api(`/api/orders/${id}`, json('PATCH', { status }));
    load();
  }
  const fresh = orders.filter((o) => o.status === 'new');
  const ready = orders.filter((o) => o.status === 'prepared');
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h2 className="font-semibold mb-3">To prepare <span className="text-roast/50">({fresh.length})</span></h2>
        <div className="space-y-4">{fresh.map((o) => <OrderCard key={o.id} o={o} onStatus={setStatus} />)}
          {!fresh.length && <p className="text-sm text-roast/50">No new orders. Updates every few seconds.</p>}</div>
      </div>
      <div>
        <h2 className="font-semibold mb-3">Ready to serve <span className="text-roast/50">({ready.length})</span></h2>
        <div className="space-y-4">{ready.map((o) => <OrderCard key={o.id} o={o} onStatus={setStatus} />)}
          {!ready.length && <p className="text-sm text-roast/50">Nothing waiting to be served.</p>}</div>
      </div>
    </div>
  );
}

/* ---------------- Guest requests (waiter, water, tissues, bill) ---------------- */
const REQ = { waiter: ['🛎️', 'Call waiter'], water: ['💧', 'Water'], tissues: ['🧻', 'Tissues'], bill: ['🧾', 'Bring the bill'] };

function Requests({ reqs, reload }) {
  async function done(id) {
    haptic('success');
    await api(`/api/requests/${id}`, json('PATCH', {}));
    reload();
  }
  if (!reqs.length)
    return <p className="text-roast/60 text-center py-16">No requests right now. Guests' calls appear here instantly.</p>;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {reqs.map((r) => {
        const [emoji, label] = REQ[r.type] || ['❓', r.type];
        const mins = Math.floor((Date.now() - r.createdAt) / 60000);
        return (
          <div key={r.id} className={`bg-white rounded-2xl border-2 p-4 shadow-sm pop ${mins >= 3 ? 'border-red-400' : 'border-caramel'}`}>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{emoji}</span>
              <div className="flex-1">
                <div className="text-2xl font-bold">Table {r.table}</div>
                <div className="font-medium">{label}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`text-xs ${mins >= 3 ? 'text-red-700 font-semibold' : 'text-roast/60'}`}>{mins < 1 ? 'just now' : `${mins} min ago`}</span>
              <button onPointerDown={ripple} onClick={() => done(r.id)} className="relative overflow-hidden active:scale-95 transition bg-sage text-white rounded-lg px-4 py-2 text-sm font-medium">Done</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Menu management ---------------- */
function MenuManager() {
  const [menu, setMenu] = useState(null);
  const [saved, setSaved] = useState('');
  const [form, setForm] = useState({ name: '', category: '', type: 'beverage', emoji: '☕', desc: '', S: '', M: '', L: '', price: '' });
  useEffect(() => { api('/api/menu').then((r) => r.json()).then((m) => { setMenu(m); setForm((f) => ({ ...f, category: m.categories[0] })); }); }, []);
  if (!menu) return null;

  async function persist(next) {
    setMenu(next);
    await api('/api/menu', json('PUT', next));
    setSaved('Saved'); setTimeout(() => setSaved(''), 1200);
  }
  const upd = (id, patch) => persist({ ...menu, items: menu.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const del = (id) => confirm('Delete this item?') && persist({ ...menu, items: menu.items.filter((i) => i.id !== id) });

  function add(e) {
    e.preventDefault();
    const bev = form.type === 'beverage';
    const item = {
      id: 'i' + Date.now().toString(36), name: form.name, category: form.category, type: form.type,
      emoji: form.emoji || '☕', desc: form.desc, available: true,
      ...(bev
        ? { prices: { S: +form.S, M: +form.M, L: +form.L }, sugar: true, milk: false, shot: false }
        : { price: +form.price, veg: true }),
    };
    persist({ ...menu, items: [...menu.items, item] });
    setForm({ ...form, name: '', desc: '', S: '', M: '', L: '', price: '' });
  }
  const inp = 'border border-latte/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-roast';

  return (
    <div>
      <form onSubmit={add} className="bg-white rounded-2xl border border-latte/30 p-4 mb-8 grid grid-cols-2 md:grid-cols-6 gap-3">
        <h3 className="col-span-full font-semibold">Add item {saved && <span className="text-sage text-sm ml-2">{saved}</span>}</h3>
        <input required className={`${inp} md:col-span-2`} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className={inp} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="beverage">Beverage</option><option value="food">Food</option>
        </select>
        <select className={inp} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {menu.categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className={inp} placeholder="Emoji" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        <input className={`${inp} col-span-full md:col-span-3`} placeholder="Description" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
        {form.type === 'beverage' ? ['S', 'M', 'L'].map((s) => (
          <input key={s} required type="number" className={inp} placeholder={`${SIZE[s]} price`} value={form[s]} onChange={(e) => setForm({ ...form, [s]: e.target.value })} />
        )) : (
          <input required type="number" className={inp} placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        )}
        <button className="bg-espresso text-foam rounded-lg px-4 py-2 text-sm font-medium">Add</button>
      </form>

      {menu.categories.map((c) => (
        <div key={c} className="mb-8">
          <h3 className="font-display text-xl mb-3">{c}</h3>
          <div className="bg-white rounded-2xl border border-latte/30 divide-y divide-latte/20">
            {menu.items.filter((i) => i.category === c).map((i) => (
              <div key={i.id} className={`p-3 flex flex-wrap items-center gap-3 ${i.available ? '' : 'opacity-50'}`}>
                <span className="text-xl">{i.emoji}</span>
                <span className="font-medium flex-1 min-w-[140px]">{i.name}</span>
                {i.type === 'beverage' ? ['S', 'M', 'L'].map((s) => (
                  <label key={s} className="text-xs text-roast/60">{s}
                    <input type="number" defaultValue={i.prices[s]} className="ml-1 w-16 border border-latte/50 rounded px-1.5 py-1 text-sm text-espresso"
                      onBlur={(e) => +e.target.value !== i.prices[s] && upd(i.id, { prices: { ...i.prices, [s]: +e.target.value } })} />
                  </label>
                )) : (
                  <label className="text-xs text-roast/60">{CURRENCY}
                    <input type="number" defaultValue={i.price} className="ml-1 w-20 border border-latte/50 rounded px-1.5 py-1 text-sm text-espresso"
                      onBlur={(e) => +e.target.value !== i.price && upd(i.id, { price: +e.target.value })} />
                  </label>
                )}
                <button onClick={() => upd(i.id, { available: !i.available })}
                  className={`text-xs rounded-full px-3 py-1 border ${i.available ? 'border-sage text-sage' : 'border-roast/40 text-roast/60'}`}>
                  {i.available ? 'Available' : 'Sold out'}
                </button>
                <button onClick={() => del(i.id)} className="text-xs text-red-700">Delete</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- QR codes ---------------- */
function QRCodes() {
  const [count, setCount] = useState(10);
  const [qrs, setQrs] = useState([]);
  const [gen, setGen] = useState(0);
  useEffect(() => {
    let live = true;
    (async () => {
      const r = await api(`/api/qr?count=${count}`, { cache: 'no-store' });
      if (!r.ok || !live) return;
      const list = await r.json();
      const out = [];
      for (const { table, token } of list) {
        const url = `${window.location.origin}/menu?table=${token}`;
        out.push({ t: table, url, token, img: await QRCode.toDataURL(url, { width: 360, margin: 1, color: { dark: '#2E1F17' } }) });
      }
      if (live) setQrs(out);
    })();
    return () => { live = false; };
  }, [count, gen]);
  return (
    <div>
      <div className="flex items-center gap-3 mb-6 print:hidden flex-wrap">
        <label className="text-sm">Number of tables
          <input type="number" min="1" max="100" value={count} onChange={(e) => setCount(Math.max(1, Math.min(100, +e.target.value || 1)))}
            className="ml-2 w-20 border border-latte/50 rounded-lg px-2 py-1.5" />
        </label>
        <button onPointerDown={ripple} onClick={() => { haptic('select'); setGen((g) => g + 1); }} className="btn border border-latte bg-foam px-4 py-2 text-sm">Regenerate codes</button>
        <button onPointerDown={ripple} onClick={() => { haptic('tap'); window.print(); }} className="btn btn-dark px-4 py-2 text-sm">Print QR codes</button>
        <span className="text-xs text-roast/60">Each QR holds an encrypted table code. Links use this site's address: {typeof window !== 'undefined' && window.location.origin}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {qrs.map((q) => (
          <div key={q.t} className="bg-white rounded-2xl border border-latte/30 p-4 text-center break-inside-avoid">
            <div className="font-display font-bold text-lg">{CAFE_NAME}</div>
            <img src={q.img} alt={`Table ${q.t}`} className="w-full" />
            <div className="font-bold text-xl">Table {q.t}</div>
            <div className="text-xs text-roast/60">Scan to order</div>
            <div className="mt-1 text-[10px] text-roast/40 break-all print:hidden" title={q.url}>{q.token}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- History ---------------- */
function History() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api('/api/orders?scope=served').then((r) => r.json()).then(setOrders); }, []);
  const sum = orders.reduce((s, o) => s + o.total, 0);
  return (
    <div>
      <p className="mb-4 text-sm text-roast/70">{orders.length} served orders · {CURRENCY}{sum} total</p>
      <div className="bg-white rounded-2xl border border-latte/30 divide-y divide-latte/20">
        {orders.map((o) => (
          <div key={o.id} className="p-3 text-sm flex flex-wrap gap-x-4 gap-y-1">
            <b>#{String(o.number).padStart(3, '0')}</b><span>Table {o.table}</span>{o.phone && <span className="text-roast/60">+91 {String(o.phone).slice(-10)}</span>}
            <span className="flex-1 text-roast/70">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</span>
            <span className="font-semibold">{CURRENCY}{o.total}</span>
            {o.paid && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">PAID</span>}
            <span className="text-roast/50">{new Date(o.createdAt).toLocaleString()}</span>
          </div>
        ))}
        {!orders.length && <p className="p-6 text-center text-roast/50">No served orders yet.</p>}
      </div>
    </div>
  );
}

/* ---------------- Shell ---------------- */
const TABS = [['orders', 'Live Orders'], ['requests', 'Requests'], ['menu', 'Menu'], ['qr', 'QR Codes'], ['history', 'History']];

export default function Admin() {
  const [authed, setAuthed] = useState(null);
  const [tab, setTab] = useState('orders');
  useEffect(() => { api('/api/auth').then((r) => setAuthed(r.ok)); }, []);

  // Guest requests are polled here so staff hear/see them from any tab.
  const [reqs, setReqs] = useState([]);
  const seenReq = useRef(null);
  const loadReqs = useCallback(async () => {
    const r = await api('/api/requests', { cache: 'no-store' });
    if (!r.ok) return;
    const data = await r.json();
    if (seenReq.current && data.some((x) => !seenReq.current.has(x.id))) { beep(); haptic('success'); }
    seenReq.current = new Set(data.map((x) => x.id));
    setReqs(data);
  }, []);
  useEffect(() => {
    if (!authed) return;
    loadReqs();
    const t = setInterval(loadReqs, 4000);
    return () => clearInterval(t);
  }, [authed, loadReqs]);
  if (authed === null) return null;
  if (!authed) return <Login onDone={() => setAuthed(true)} />;
  return (
    <div className="min-h-screen">
      <PhotoBg src="/img/tw-9.jpg" light animate={false} />
      <header className="bg-espresso text-foam print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-2 font-display font-bold text-lg mr-4"><CupMark className="w-7 h-7 text-latte" />{CAFE_NAME} <span className="text-latte text-sm font-sans font-medium">· Staff</span></span>
          <nav className="flex gap-1 flex-1 overflow-x-auto">
            {TABS.map(([k, label]) => (
              <button key={k} onClick={() => { haptic('select'); setTab(k); }}
                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition active:scale-95 ${tab === k ? 'bg-foam text-espresso' : 'text-foam/80 hover:bg-foam/10'}`}>{label}{k === 'requests' && reqs.length > 0 && <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-caramel text-foam text-xs font-bold animate-pulse">{reqs.length}</span>}</button>
            ))}
          </nav>
          <button onClick={async () => { await api('/api/auth', { method: 'DELETE' }); setAuthed(false); }} className="text-sm text-foam/70 hover:text-foam">Sign out</button>
        </div>
      </header>
      <main key={tab} className="max-w-6xl mx-auto p-4 md:p-6 rise">
        {tab === 'orders' && <LiveOrders />}
        {tab === 'requests' && <Requests reqs={reqs} reload={loadReqs} />}
        {tab === 'menu' && <MenuManager />}
        {tab === 'qr' && <QRCodes />}
        {tab === 'history' && <History />}
      </main>
    </div>
  );
}

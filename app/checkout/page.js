'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CAFE_NAME, OUTLET, CURRENCY } from '@/lib/brand';
import { computeBill, money } from '@/lib/bill';
import { burstConfetti, haptic, ripple } from '@/lib/fx';
import { useSession } from '@/lib/session';
import { CupMark, PhotoBg } from '../components/Brand';
import SiteNav from '../components/SiteNav';

const SIZE = { S: 'Small', M: 'Medium', L: 'Large' };
const METHODS = [['card', 'Card', '💳'], ['upi', 'UPI', '📲'], ['netbanking', 'Netbanking', '🏦'], ['wallet', 'Wallets', '👛']];
const BANKS = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Bank', 'Other bank'];
const WALLETS = ['Paytm', 'PhonePe', 'Amazon Pay', 'Mobikwik'];
const UPI_APPS = ['GPay', 'PhonePe', 'Paytm', 'BHIM'];

const inp = 'w-full border-2 border-latte/50 bg-white rounded-xl px-4 py-3 outline-none focus:border-caramel transition';

function Pill({ active, onClick, children }) {
  return (
    <button type="button" onPointerDown={ripple} onClick={() => { haptic('select'); onClick(); }}
      className={`relative overflow-hidden shrink-0 whitespace-nowrap px-4 py-2.5 rounded-full text-sm border transition active:scale-95 ${active ? 'bg-espresso text-foam border-espresso shadow-md' : 'bg-white text-roast border-latte/50'}`}>
      {children}
    </button>
  );
}

/* ---------- Step 2: fake payment gateway ---------- */
function PaymentScreen({ amount, onBack, onPaid }) {
  const [method, setMethod] = useState('card');
  const [card, setCard] = useState({ number: '', name: '', exp: '', cvv: '' });
  const [upi, setUpi] = useState('');
  const [bank, setBank] = useState('');
  const [wallet, setWallet] = useState('');
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(0);

  const digits = card.number.replace(/\D/g, '');
  const brand = digits.startsWith('4') ? 'Visa' : /^5[1-5]|^2/.test(digits) ? 'Mastercard' : digits.startsWith('6') ? 'RuPay' : 'Card';

  function validate() {
    if (method === 'card') {
      if (digits.length < 12) return 'Enter a card number (any 12–19 digits).';
      if (!card.name.trim()) return 'Enter the name on the card (any name).';
      if (!/^\d{2}\/\d{2}$/.test(card.exp)) return 'Enter an expiry like 12/30 (any date).';
      if (!/^\d{3,4}$/.test(card.cvv)) return 'Enter a 3 or 4 digit CVV (any digits).';
    }
    if (method === 'upi' && !upi.trim()) return 'Enter a UPI ID (anything works, e.g. test@upi).';
    if (method === 'netbanking' && !bank) return 'Pick a bank.';
    if (method === 'wallet' && !wallet) return 'Pick a wallet.';
    return '';
  }

  function pay(e) {
    e.preventDefault();
    const m = validate();
    if (m) { haptic('error'); setErr(m); setShake((s) => s + 1); return; }
    setErr(''); haptic('add');
    const ref = method === 'card' ? `${brand} •••• ${digits.slice(-4)}` : method === 'upi' ? upi.trim() : method === 'netbanking' ? bank : wallet;
    onPaid(method, ref);
  }

  function fillTest() {
    haptic('select');
    if (method === 'card') setCard({ number: '4242 4242 4242 4242', name: 'Test User', exp: '12/30', cvv: '123' });
    if (method === 'upi') setUpi('test@upi');
    if (method === 'netbanking') setBank(BANKS[0]);
    if (method === 'wallet') setWallet(WALLETS[0]);
    setErr('');
  }

  return (
    <form key={shake} onSubmit={pay} className={`w-full max-w-lg mx-auto bg-foam rounded-3xl shadow-2xl overflow-hidden pop ${shake ? 'shake' : ''}`}>
      <div className="bg-espresso text-foam p-6 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-latte">Paying to</div>
          <div className="font-display font-bold text-xl flex items-center gap-2"><CupMark className="w-6 h-6 text-latte" />{CAFE_NAME}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-latte">Amount</div>
          <div className="font-bold text-2xl">{CURRENCY}{money(amount)}</div>
        </div>
      </div>

      <div className="p-6">
        <div className="rounded-2xl border-2 border-dashed border-amber-500 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
          <b>Demo payment, nothing is charged.</b> Any fake details are accepted. Please don't enter real card or bank details.
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {METHODS.map(([k, label, icon]) => (
            <Pill key={k} active={method === k} onClick={() => { setMethod(k); setErr(''); }}>{icon} {label}</Pill>
          ))}
        </div>

        <div key={method} className="mt-5 space-y-3 rise">
          {method === 'card' && (
            <>
              <div className="relative">
                <input className={inp} inputMode="numeric" autoComplete="off" placeholder="Card number" aria-label="Card number" maxLength={23}
                  value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim() })} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-caramel">{digits ? brand : ''}</span>
              </div>
              <input className={inp} placeholder="Name on card" aria-label="Name on card" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className={inp} inputMode="numeric" placeholder="MM/YY" aria-label="Expiry" maxLength={5} value={card.exp}
                  onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); setCard({ ...card, exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }); }} />
                <input className={inp} inputMode="numeric" type="password" placeholder="CVV" aria-label="CVV" maxLength={4} value={card.cvv}
                  onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} />
              </div>
            </>
          )}
          {method === 'upi' && (
            <>
              <input className={inp} placeholder="yourname@upi" aria-label="UPI ID" autoCapitalize="none" value={upi} onChange={(e) => setUpi(e.target.value)} />
              <div className="flex flex-wrap gap-2">{UPI_APPS.map((a) => <Pill key={a} active={upi === `test@${a.toLowerCase()}`} onClick={() => setUpi(`test@${a.toLowerCase()}`)}>{a}</Pill>)}</div>
            </>
          )}
          {method === 'netbanking' && <div className="flex flex-wrap gap-2">{BANKS.map((b) => <Pill key={b} active={bank === b} onClick={() => setBank(b)}>{b}</Pill>)}</div>}
          {method === 'wallet' && <div className="flex flex-wrap gap-2">{WALLETS.map((w) => <Pill key={w} active={wallet === w} onClick={() => setWallet(w)}>{w}</Pill>)}</div>}
        </div>

        <button type="button" onClick={fillTest} className="mt-4 text-sm text-caramel underline">Fill with test details</button>
        {err && <p className="text-red-700 text-sm mt-3" role="alert">{err}</p>}

        <button onPointerDown={ripple} className="btn btn-primary w-full mt-5 py-4 text-base">Pay {CURRENCY}{money(amount)}</button>
        <button type="button" onClick={() => { haptic('tap'); onBack(); }} className="w-full mt-3 text-sm text-roast">← Back to bill</button>
      </div>
    </form>
  );
}

/* ---------- Page ---------- */
export default function Checkout() {
  const router = useRouter();
  const { ready, token, phone } = useSession();
  const [orders, setOrders] = useState(null);
  const [step, setStep] = useState('review'); // review | pay | processing | done
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const loaded = useRef(false);

  useEffect(() => {
    if (!ready || loaded.current) return;
    loaded.current = true;
    if (!token || !phone) { setOrders([]); return; }
    fetch(`/api/orders/mine?token=${encodeURIComponent(token)}&phone=${encodeURIComponent(phone)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [ready, token, phone]);

  async function pay(method, ref) {
    setStep('processing');
    const steps = ['Contacting your bank…', 'Verifying details…', 'Confirming payment…'];
    steps.forEach((s, i) => setTimeout(() => setMsg(s), i * 800));
    await new Promise((r) => setTimeout(r, 2500));
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, phone, method, ref }) });
      const data = await res.json();
      if (!res.ok) { haptic('error'); setErr(data.error || 'Payment failed'); setStep('pay'); return; }
      haptic('success'); burstConfetti(50); setStep('done');
      setTimeout(() => router.push(`/bill?id=${data.id}`), 1600);
    } catch {
      haptic('error'); setErr('Network error. Please try again.'); setStep('pay');
    }
  }

  const bill = orders ? computeBill(orders) : null;

  return (
    <>
      <PhotoBg src="/img/tw-9.jpg" animate={false} />
      <SiteNav />
      <main className="min-h-screen px-4 pt-24 pb-16">
        {orders === null ? (
          <p className="text-center text-foam font-display italic text-xl mt-24">Preparing your bill…</p>
        ) : !orders.length ? (
          <div className="max-w-md mx-auto bg-foam rounded-3xl p-8 text-center shadow-2xl pop">
            <div className="text-5xl">🧾</div>
            <h1 className="font-display font-bold text-2xl mt-3">Nothing to pay</h1>
            <p className="text-roast/80 mt-1">{token ? "You don't have any unpaid orders." : 'Scan your table QR first to start an order.'}</p>
            <Link href="/menu" className="btn btn-primary mt-6 px-7 py-3.5">Go to menu</Link>
          </div>
        ) : step === 'review' ? (
          <div className="max-w-lg mx-auto bg-foam rounded-3xl shadow-2xl overflow-hidden pop">
            <div className="p-6 pb-4">
              <h1 className="font-display font-bold text-3xl">Checkout</h1>
              <p className="text-sm text-roast/70">{CAFE_NAME} · {OUTLET} · Table {orders[0].table ?? ''}</p>
            </div>
            <div className="px-6 space-y-4">
              {orders.map((o) => (
                <div key={o.id}>
                  <div className="text-xs font-semibold uppercase tracking-widest text-roast/60 mb-1">Order #{String(o.number).padStart(3, '0')}</div>
                  <ul className="divide-y divide-latte/20">
                    {o.items.map((i, k) => (
                      <li key={k} className="py-2 flex justify-between gap-3 text-sm">
                        <span>
                          {i.qty} × {i.name}
                          <span className="block text-xs text-roast/60">
                            {[i.size && SIZE[i.size], i.sugar, i.milk, i.extraShot && 'Extra shot'].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        <span className="font-medium">{CURRENCY}{money(i.unitPrice * i.qty)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="m-6 mt-5 rounded-2xl bg-cream p-4 text-sm space-y-1.5">
              <div className="flex justify-between"><span>Subtotal</span><span>{CURRENCY}{money(bill.subtotal)}</span></div>
              <div className="flex justify-between text-roast"><span>CGST ({bill.rate}%)</span><span>{CURRENCY}{money(bill.cgst)}</span></div>
              <div className="flex justify-between text-roast"><span>SGST ({bill.rate}%)</span><span>{CURRENCY}{money(bill.sgst)}</span></div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-latte/40"><span>Total</span><span>{CURRENCY}{money(bill.total)}</span></div>
            </div>
            {err && <p className="text-red-700 text-sm px-6 -mt-2 mb-3" role="alert">{err}</p>}
            <div className="px-6 pb-6 space-y-3">
              <button onPointerDown={ripple} onClick={() => { haptic('add'); setStep('pay'); }} className="btn btn-primary w-full py-4 text-base">Pay now · {CURRENCY}{money(bill.total)}</button>
              <Link href="/menu" className="block text-center text-sm text-roast">← Order more</Link>
            </div>
          </div>
        ) : step === 'pay' ? (
          <>
            {err && <p className="max-w-lg mx-auto mb-3 rounded-xl bg-red-50 text-red-800 px-4 py-2 text-sm" role="alert">{err}</p>}
            <PaymentScreen amount={bill.total} onBack={() => setStep('review')} onPaid={pay} />
          </>
        ) : (
          <div className="max-w-sm mx-auto bg-foam rounded-3xl shadow-2xl p-10 text-center pop mt-16">
            {step === 'processing' ? (
              <>
                <div className="mx-auto w-16 h-16 rounded-full border-4 border-latte/40 border-t-caramel animate-spin" />
                <h2 className="font-display font-bold text-2xl mt-6">Processing payment</h2>
                <p className="text-roast/80 mt-1 min-h-[1.5rem]">{msg || 'Starting…'}</p>
                <p className="text-xs text-roast/50 mt-4">Please don't close this page.</p>
              </>
            ) : (
              <>
                <div className="mx-auto w-20 h-20 rounded-full bg-sage flex items-center justify-center pop">
                  <svg viewBox="0 0 52 52" className="w-12 h-12"><path className="draw" d="M14 27l8 8 16-17" fill="none" stroke="#FFFaf2" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h2 className="font-display font-bold text-2xl mt-5">Payment successful</h2>
                <p className="text-roast/80 mt-1">Generating your bill…</p>
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}

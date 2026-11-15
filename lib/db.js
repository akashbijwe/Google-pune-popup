import fs from 'fs';
import path from 'path';

const BUNDLED = path.join(process.cwd(), 'data');
const DIR = process.env.DATA_DIR || BUNDLED;

function read(name) {
  const file = path.join(DIR, name);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    // seed from bundled copy on first run
    const seed = JSON.parse(fs.readFileSync(path.join(BUNDLED, name), 'utf8'));
    write(name, seed);
    return seed;
  }
}
function write(name, data) {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, name), JSON.stringify(data, null, 2));
}

export const getMenu = () => read('menu.json');
export const saveMenu = (m) => write('menu.json', m);
export const getOrders = () => read('orders.json');
export const saveOrders = (o) => write('orders.json', o);

export const getBills = () => read('bills.json');
export const saveBills = (b) => write('bills.json', b);

// A guest's unpaid orders (same table + phone, last 12 hours).
export function matchGuest(orders, table, phone, { unpaidOnly = true } = {}) {
  const since = Date.now() - 12 * 60 * 60 * 1000;
  return orders
    .filter((o) => o.table === table && o.phone && String(o.phone).slice(-10) === phone && o.createdAt >= since && (!unpaidOnly || !o.paid))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export const getScores = () => read('scores.json');
export const saveScores = (s) => write('scores.json', s);
// Calendar day in Pune, so "today's top score" resets at local midnight.
export const dayKey = (t) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

export const getRequests = () => read("requests.json");
export const saveRequests = (r) => write("requests.json", r);

export const getTrivia = () => read("trivia.json");
export const saveTrivia = (t) => write("trivia.json", t);
export const getDiscounts = () => read("discounts.json");
export const saveDiscounts = (d) => write("discounts.json", d);
// Unspent quiz discount (₹) for a guest: same table + phone, last 12 hours.
export function availableDiscount(discounts, table, phone) {
  const since = Date.now() - 12 * 60 * 60 * 1000;
  return discounts.filter((d) => d.table === table && d.phone === phone && d.at >= since).reduce((s, d) => s + d.remaining, 0);
}

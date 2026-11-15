import { NextResponse } from 'next/server';
import { getOrders, matchGuest } from '@/lib/db';
import { decryptTable } from '@/lib/qr';

export const dynamic = 'force-dynamic';

// customer: this guest's orders (same phone + table, last 12 hours).
// Unpaid only by default; ?all=1 also includes paid ones (used for live status tracking).
export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const table = decryptTable(q.get('token'));
  const phone = String(q.get('phone') || '').replace(/\D/g, '').slice(-10);
  if (!table || phone.length < 10) return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  const mine = matchGuest(getOrders(), table, phone, { unpaidOnly: q.get('all') !== '1' })
    .map(({ id, number, table, items, total, status, createdAt, paid }) => ({ id, number, table, items, total, status, createdAt, paid: !!paid }));
  return NextResponse.json(mine);
}

import { NextResponse } from 'next/server';
import { getOrders, saveOrders, getBills, saveBills, matchGuest } from '@/lib/db';
import { decryptTable } from '@/lib/qr';
import { computeBill } from '@/lib/bill';

export const dynamic = 'force-dynamic';

// customer: pay for all unpaid orders. DEMO ONLY: no real payment happens and the
// client only sends a masked label (e.g. "Visa •••• 4242"), never raw card details.
export async function POST(req) {
  const body = await req.json();
  const table = decryptTable(body.token);
  const phone = String(body.phone || '').replace(/\D/g, '').slice(-10);
  if (!table || phone.length < 10) return NextResponse.json({ error: 'Invalid session. Please scan your table QR again.' }, { status: 400 });
  if (!['card', 'upi', 'netbanking', 'wallet'].includes(body.method))
    return NextResponse.json({ error: 'Choose a payment method' }, { status: 400 });

  const orders = getOrders();
  const mine = matchGuest(orders, table, phone);
  if (!mine.length) return NextResponse.json({ error: 'Nothing to pay. All orders are already paid.' }, { status: 400 });

  const bills = getBills();
  const now = Date.now();
  const bill = {
    id: now.toString(36) + Math.random().toString(36).slice(2, 6),
    billNo: bills.reduce((m, b) => Math.max(m, b.billNo), 0) + 1,
    table, phone,
    orders: mine.map((o) => ({ number: o.number, createdAt: o.createdAt, items: o.items })),
    ...computeBill(mine),
    method: body.method,
    ref: String(body.ref || '').slice(0, 60),
    paidAt: now,
  };
  bills.push(bill);
  saveBills(bills);
  for (const o of mine) { o.paid = true; o.paidAt = now; o.billId = bill.id; }
  saveOrders(orders);
  return NextResponse.json(bill);
}

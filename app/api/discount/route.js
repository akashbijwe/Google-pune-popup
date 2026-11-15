import { NextResponse } from 'next/server';
import { getDiscounts, availableDiscount } from '@/lib/db';
import { decryptTable } from '@/lib/qr';

export const dynamic = 'force-dynamic';

// customer: quiz discount (₹) this guest has earned and not yet used
export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const table = decryptTable(q.get('token'));
  const phone = String(q.get('phone') || '').replace(/\D/g, '').slice(-10);
  if (!table || phone.length < 10) return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  return NextResponse.json({ amount: availableDiscount(getDiscounts(), table, phone) });
}

import { NextResponse } from 'next/server';
import { getBills } from '@/lib/db';

export const dynamic = 'force-dynamic';

// customer: fetch a bill (must match the phone it was issued to)
export async function GET(req, { params }) {
  const phone = String(new URL(req.url).searchParams.get('phone') || '').replace(/\D/g, '').slice(-10);
  const bill = getBills().find((b) => b.id === params.id);
  if (!bill || bill.phone.slice(-10) !== phone) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
  return NextResponse.json(bill);
}

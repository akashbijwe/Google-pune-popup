import { NextResponse } from 'next/server';
import { decryptTable } from '@/lib/qr';

export const dynamic = 'force-dynamic';

// customer: validate a scanned table code
export async function GET(req) {
  const table = decryptTable(new URL(req.url).searchParams.get('t'));
  if (!table) return NextResponse.json({ error: 'Invalid table code' }, { status: 400 });
  return NextResponse.json({ table });
}

import { NextResponse } from 'next/server';
import { getRequests } from '@/lib/db';
import { decryptTable } from '@/lib/qr';

export const dynamic = 'force-dynamic';

// customer: this table's pending requests
export async function GET(req) {
  const table = decryptTable(new URL(req.url).searchParams.get('token'));
  if (!table) return NextResponse.json({ error: 'Invalid table code' }, { status: 400 });
  const pending = getRequests()
    .filter((r) => r.table === table && r.status === 'pending')
    .map(({ id, type, createdAt }) => ({ id, type, createdAt }));
  return NextResponse.json({ table, pending });
}

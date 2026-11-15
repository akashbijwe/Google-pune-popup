import { NextResponse } from 'next/server';
import { getRequests, saveRequests } from '@/lib/db';
import { decryptTable } from '@/lib/qr';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const TYPES = ['waiter', 'water', 'tissues', 'bill'];

// staff: all pending requests, oldest first
export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(getRequests().filter((r) => r.status === 'pending').sort((a, b) => a.createdAt - b.createdAt));
}

// customer: ask for help. One pending request per table and type (repeat taps don't spam staff).
export async function POST(req) {
  const b = await req.json();
  const table = decryptTable(b.token);
  if (!table) return NextResponse.json({ error: 'Invalid table code. Please scan your table QR again.' }, { status: 400 });
  if (!TYPES.includes(b.type)) return NextResponse.json({ error: 'Unknown request' }, { status: 400 });
  const all = getRequests();
  const existing = all.find((r) => r.table === table && r.type === b.type && r.status === 'pending');
  if (existing) return NextResponse.json({ ...existing, duplicate: true });
  const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), table, type: b.type, status: 'pending', createdAt: Date.now() };
  const cutoff = Date.now() - 24 * 3600 * 1000;
  saveRequests([...all.filter((r) => r.createdAt >= cutoff), item]);
  return NextResponse.json(item);
}

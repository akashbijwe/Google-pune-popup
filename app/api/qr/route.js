import { NextResponse } from 'next/server';
import { encryptTable } from '@/lib/qr';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// staff: fresh encrypted code for each table (?count=N)
export async function GET(req) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const count = Math.max(1, Math.min(100, parseInt(new URL(req.url).searchParams.get('count')) || 10));
  return NextResponse.json(Array.from({ length: count }, (_, i) => ({ table: i + 1, token: encryptTable(i + 1) })));
}

import { NextResponse } from 'next/server';
import { getRequests, saveRequests } from '@/lib/db';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// staff: mark a request as done
export async function PATCH(req, { params }) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const all = getRequests();
  const r = all.find((x) => x.id === params.id);
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  r.status = 'done';
  r.doneAt = Date.now();
  saveRequests(all);
  return NextResponse.json(r);
}

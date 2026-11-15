import { NextResponse } from 'next/server';
import { COOKIE, makeToken, isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: isAuthed() }, { status: isAuthed() ? 200 : 401 });
}

export async function POST(req) {
  // Demo mode: any non-empty username and password is accepted.
  const { username, password } = await req.json();
  if (!String(username || '').trim() || !String(password || '').trim())
    return NextResponse.json({ error: 'Enter a username and password' }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE);
  return res;
}

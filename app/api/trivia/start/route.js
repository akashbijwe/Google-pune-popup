import { NextResponse } from 'next/server';
import { getTrivia, saveTrivia, getDiscounts } from '@/lib/db';
import { decryptTable } from '@/lib/qr';
import { makeQuestions } from '@/lib/trivia';
import { QUIZ_OFF } from '@/lib/brand';

export const dynamic = 'force-dynamic';

// customer: start a trivia round. Questions are sent without answers.
export async function POST(req) {
  const b = await req.json();
  const table = decryptTable(b.token);
  const phone = String(b.phone || '').replace(/\D/g, '').slice(-10);
  if (!table || phone.length < 10) return NextResponse.json({ error: 'Invalid session' }, { status: 400 });

  // The bill discount can be earned once per guest. Later rounds are just for fun and the leaderboard.
  const since = Date.now() - 12 * 60 * 60 * 1000;
  const canEarn = !getDiscounts().some((d) => d.table === table && d.phone === phone && d.at >= since);

  const qs = makeQuestions(5);
  const play = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), table, phone, qs, answers: [], canEarn, finished: false, createdAt: Date.now() };
  saveTrivia([...getTrivia().filter((p) => p.createdAt >= Date.now() - 24 * 3600 * 1000), play]);
  return NextResponse.json({ id: play.id, canEarn, perCorrect: QUIZ_OFF, questions: qs.map(({ q, opts }) => ({ q, opts })) });
}

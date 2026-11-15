import { NextResponse } from 'next/server';
import { getTrivia, saveTrivia } from '@/lib/db';

export const dynamic = 'force-dynamic';

// customer: answer the next question. The first answer to each question is final.
export async function POST(req) {
  const b = await req.json();
  const plays = getTrivia();
  const play = plays.find((p) => p.id === b.id);
  const i = Number(b.i);
  if (!play || play.finished || !Number.isInteger(i) || i < 0 || i >= play.qs.length || i > play.answers.length)
    return NextResponse.json({ error: 'Invalid round' }, { status: 400 });
  const q = play.qs[i];
  if (play.answers[i] === undefined) {
    const choice = Number.isInteger(b.choice) && b.choice >= 0 && b.choice < q.opts.length ? b.choice : -1; // -1 = timed out
    play.answers[i] = choice;
    saveTrivia(plays);
  }
  return NextResponse.json({ correct: play.answers[i] === q.correct, correctIdx: q.correct });
}

import { NextResponse } from 'next/server';
import { getTrivia, saveTrivia, getDiscounts, saveDiscounts } from '@/lib/db';
import { QUIZ_OFF } from '@/lib/brand';

export const dynamic = 'force-dynamic';

// customer: finish the round. ₹10 per correct answer is added to the guest's discount (once per guest).
export async function POST(req) {
  const b = await req.json();
  const plays = getTrivia();
  const play = plays.find((p) => p.id === b.id);
  if (!play) return NextResponse.json({ error: 'Invalid round' }, { status: 400 });
  if (!play.finished) {
    play.correctCount = play.qs.reduce((n, q, i) => n + (play.answers[i] === q.correct ? 1 : 0), 0);
    play.discount = 0;
    const since = Date.now() - 12 * 60 * 60 * 1000;
    const discounts = getDiscounts();
    const already = discounts.some((d) => d.table === play.table && d.phone === play.phone && d.at >= since);
    if (play.canEarn && !already && play.correctCount > 0) {
      play.discount = play.correctCount * QUIZ_OFF;
      discounts.push({ id: play.id, table: play.table, phone: play.phone, amount: play.discount, remaining: play.discount, at: Date.now() });
      saveDiscounts(discounts);
    }
    play.finished = true;
    saveTrivia(plays);
  }
  return NextResponse.json({ correctCount: play.correctCount, total: play.qs.length, discount: play.discount, canEarn: play.canEarn });
}

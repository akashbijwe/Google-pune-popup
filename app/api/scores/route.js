import { NextResponse } from 'next/server';
import { getScores, saveScores, dayKey } from '@/lib/db';
import { decryptTable } from '@/lib/qr';

export const dynamic = 'force-dynamic';

const MAX = { trivia: 150, catch: 200 };

function top(scores, game) {
  const today = dayKey(Date.now());
  const best = new Map();
  for (const s of scores) {
    if (s.game !== game || dayKey(s.at) !== today) continue;
    if (!best.has(s.table) || s.score > best.get(s.table)) best.set(s.table, s.score);
  }
  return [...best].map(([table, score]) => ({ table, score })).sort((a, b) => b.score - a.score).slice(0, 10);
}

// today's leaderboard (best score per table, no personal info)
export async function GET(req) {
  const game = new URL(req.url).searchParams.get('game');
  if (!MAX[game]) return NextResponse.json({ error: 'Unknown game' }, { status: 400 });
  return NextResponse.json(top(getScores(), game));
}

// submit a score for the table in the encrypted code
export async function POST(req) {
  const b = await req.json();
  const table = decryptTable(b.token);
  const score = Math.floor(Number(b.score));
  if (!table) return NextResponse.json({ error: 'Invalid table code' }, { status: 400 });
  if (!MAX[b.game] || !Number.isFinite(score) || score < 0 || score > MAX[b.game])
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
  const cutoff = Date.now() - 3 * 24 * 3600 * 1000;
  const scores = getScores().filter((s) => s.at >= cutoff);
  scores.push({ table, game: b.game, score, at: Date.now() });
  saveScores(scores);
  return NextResponse.json(top(scores, b.game));
}

import { NextResponse } from 'next/server';
import { encryptTable } from '@/lib/qr';
import { DEMO_SAMPLE_QR } from '@/lib/config';

export const dynamic = 'force-dynamic';

// TEST SITE ONLY. Hands out valid table codes so people can try the app without a printed QR.
// This defeats the purpose of the encrypted QR codes, so it must be off on the real site:
// set the env var DEMO_SAMPLE_QR=off there.
export async function GET() {
  if (!DEMO_SAMPLE_QR) return NextResponse.json({ enabled: false });
  return NextResponse.json({
    enabled: true,
    samples: [1, 2, 3, 4, 5, 6].map((table) => ({ table, token: encryptTable(table) })),
  });
}

export const AUTH_SECRET = process.env.AUTH_SECRET || 'change-me-in-prod';
// Secret used to encrypt table numbers inside QR codes. Set QR_SECRET in production.
export const QR_SECRET = process.env.QR_SECRET || 'third-wave-qr-dev-secret-change-me';

// Demo/test site only: lets the scanner offer sample table codes. Set DEMO_SAMPLE_QR=off on the real site.
export const DEMO_SAMPLE_QR = !['off', 'false', '0'].includes(String(process.env.DEMO_SAMPLE_QR || '').toLowerCase());

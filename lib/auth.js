import crypto from 'crypto';
import { cookies } from 'next/headers';
import { AUTH_SECRET } from './config';

export const COOKIE = 'twc_admin';
// Demo mode: any username/password is accepted at login, so the session token
// is the same for everyone.
export const makeToken = () => crypto.createHash('sha256').update(`staff:${AUTH_SECRET}`).digest('hex');
export const isAuthed = () => cookies().get(COOKIE)?.value === makeToken();

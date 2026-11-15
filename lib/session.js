'use client';
import { useEffect, useState } from 'react';

// The customer's session lives in sessionStorage: the encrypted table code and verified phone.
export const getSession = () => {
  try {
    return { token: sessionStorage.getItem('twc_token') || '', phone: sessionStorage.getItem('twc_phone') || '' };
  } catch {
    return { token: '', phone: '' };
  }
};
export const notifySession = () => window.dispatchEvent(new Event('twc-session'));

// `scanned` is true once a valid table code has been scanned in this browser session.
export function useSession() {
  const [s, setS] = useState({ token: '', phone: '', ready: false });
  useEffect(() => {
    const read = () => setS({ ...getSession(), ready: true });
    read();
    window.addEventListener('twc-session', read);
    return () => window.removeEventListener('twc-session', read);
  }, []);
  return { ...s, scanned: !!s.token };
}

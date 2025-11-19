import type { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import { ENV } from '@/lib/env';

type CookieStore = Pick<ResponseCookies, 'set'>;

const baseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  ...(ENV.COOKIE_DOMAIN ? { domain: ENV.COOKIE_DOMAIN } : {}),
};

const SESSION_COOKIE_NAMES = ['__session', 'session'] as const;

const clampMaxAge = (seconds: number) => Math.max(0, Math.floor(seconds));

export function setSessionCookies(store: CookieStore, value: string, maxAgeSeconds: number) {
  const options = { ...baseOptions, maxAge: clampMaxAge(maxAgeSeconds) };
  SESSION_COOKIE_NAMES.forEach((name) => {
    store.set(name, value, options);
  });
}

export function clearSessionCookies(store: CookieStore) {
  const options = { ...baseOptions, maxAge: 0 };
  SESSION_COOKIE_NAMES.forEach((name) => {
    store.set(name, '', options);
  });
}

import { getSession } from '../auth/session.ts';

let cachedToken: string | null = null;

export function profileAuthorizationHeader(): string | null {
  cachedToken ??= getSession()?.token ?? null;
  return cachedToken ? `Bearer ${cachedToken}` : null;
}

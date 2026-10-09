import { getSession } from '../auth/session.ts';

export function authorizationHeader(): string | null {
  const token = getSession()?.token;
  return token ? `Bearer ${token}` : null;
}

export interface Session {
  token: string;
}

let currentSession: Session | null = null;

export function setSession(session: Session | null): void {
  currentSession = session;
}

export function getSession(): Session | null {
  return currentSession;
}

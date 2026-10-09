import { profileAuthorizationHeader } from './profile-session.ts';

export function profileRequest(): { path: string; authorization: string | null } {
  return {
    path: '/profile',
    authorization: profileAuthorizationHeader(),
  };
}

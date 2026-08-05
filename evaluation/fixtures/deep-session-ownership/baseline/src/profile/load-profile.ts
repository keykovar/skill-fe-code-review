import { authorizationHeader } from '../api/request.ts';

export function profileRequest(): { path: string; authorization: string | null } {
  return {
    path: '/profile',
    authorization: authorizationHeader(),
  };
}

import { buildUrl } from './url.ts';

export function profileUrl(userId: string): string {
  return buildUrl('https://api.example.com/', `/users/${userId}`);
}

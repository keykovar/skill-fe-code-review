import { buildProfileCacheKey } from './cache-key.ts';

export function profileCacheKey(accountId: string): string {
  return buildProfileCacheKey(accountId);
}

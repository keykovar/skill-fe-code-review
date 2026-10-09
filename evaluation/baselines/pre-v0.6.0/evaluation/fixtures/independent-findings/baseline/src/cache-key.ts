export function buildProfileCacheKey(accountId: string): string {
  return `profile:${accountId}`;
}

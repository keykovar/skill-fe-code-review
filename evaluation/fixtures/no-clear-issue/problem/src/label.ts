export function formatUserLabel(displayName?: string, username?: string): string {
  return (displayName || username || 'Anonymous').trim();
}

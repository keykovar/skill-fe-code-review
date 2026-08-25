export function formatUserLabel(displayName?: string, username?: string): string {
  const label = displayName || username || 'Anonymous';
  return label.trim();
}

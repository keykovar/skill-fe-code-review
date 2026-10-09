export function joinUrl(base, route) {
  return `${base.replace(/\/+$/u, '')}/${route.replace(/^\/+/u, '')}`;
}

export function profileUrl(base) {
  return joinUrl(base, '/profile');
}

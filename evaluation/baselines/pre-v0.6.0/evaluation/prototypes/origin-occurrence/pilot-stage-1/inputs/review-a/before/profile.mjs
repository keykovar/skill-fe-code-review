export function joinUrl(base, route) {
  return `${base}/${route}`;
}

export function profileUrl(base) {
  return joinUrl(base, '/profile');
}

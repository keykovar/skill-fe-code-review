export function profileLabel(value) {
  return value.trim() || 'Anonymous';
}

export function profileTitle(profile) {
  return profileLabel(profile.name);
}

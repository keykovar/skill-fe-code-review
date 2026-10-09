import { profileLabel } from './format.mjs';

export { profileLabel };

export function profileTitle(profile) {
  return profileLabel(profile.name);
}

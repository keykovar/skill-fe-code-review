import { createRequestOptions } from './request-options.ts';

export function loadProfileOptions() {
  return createRequestOptions('/profile', 5_000);
}

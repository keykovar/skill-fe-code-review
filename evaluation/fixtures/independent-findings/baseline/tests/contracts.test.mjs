import assert from 'node:assert/strict';
import test from 'node:test';

import { profileCacheKey } from '../src/profile-cache.ts';
import { loadProfileOptions } from '../src/profile.ts';

test('keeps profile cache entries isolated by account', () => {
  assert.notEqual(profileCacheKey('account-1'), profileCacheKey('account-2'));
});

test('preserves the timeout selected by the caller', () => {
  assert.equal(loadProfileOptions().timeoutMs, 5_000);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { setSession } from '../src/auth/session.ts';
import { profileRequest } from '../src/profile/load-profile.ts';

test('clears authorization after logout', () => {
  setSession({ token: 'session-token' });
  assert.equal(profileRequest().authorization, 'Bearer session-token');

  setSession(null);
  assert.equal(profileRequest().authorization, null);
});

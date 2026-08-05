import assert from 'node:assert/strict';
import test from 'node:test';

import { buildUrl } from '../src/url.ts';

test('normalizes the base and path separator', () => {
  assert.equal(
    buildUrl('https://api.example.com/', '/users/42'),
    'https://api.example.com/users/42',
  );
});

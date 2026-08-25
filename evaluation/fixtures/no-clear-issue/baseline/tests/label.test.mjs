import assert from 'node:assert/strict';
import test from 'node:test';

import { formatUserLabel } from '../src/label.ts';

test('prefers and trims the display name', () => {
  assert.equal(formatUserLabel('  Ada  ', 'ada'), 'Ada');
});

test('falls back to the username', () => {
  assert.equal(formatUserLabel('', '  ada  '), 'ada');
});

test('uses the anonymous label when both names are absent', () => {
  assert.equal(formatUserLabel(), 'Anonymous');
});

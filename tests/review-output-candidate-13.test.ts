import { describe, expect, test } from 'vitest';

import { replayCandidate13Fixtures } from '../scripts/replay-review-output-candidate-13.mjs';

describe('Candidate 13 review-output fixtures', () => {
  test('accepts the fixed single-line contract and rejects bypass forms', () => {
    const result = replayCandidate13Fixtures();

    expect(result).toMatchObject({
      candidate: 'post-v0.4.0-grouped-ledger-candidate-13',
      fixtureCount: 10,
      passed: 10,
      failed: 0,
      valid: true,
    });
    expect(result.cases).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: 'evaluation/prototypes/review-output-candidate-13/corrected.valid.md',
          valid: true,
        }),
        expect.objectContaining({
          file: 'evaluation/prototypes/review-output-candidate-13/localized.corrected.valid.md',
          valid: true,
        }),
        expect.objectContaining({
          file: expect.stringContaining('single-id-merge-key.invalid.md'),
          valid: false,
        }),
        expect.objectContaining({
          file: expect.stringContaining('localized-single-id-merge-key.invalid.md'),
          valid: false,
        }),
        expect.objectContaining({
          file: expect.stringContaining('colon-only.invalid.md'),
          valid: false,
        }),
        expect.objectContaining({ file: expect.stringContaining('nested.invalid.md'), valid: false }),
        expect.objectContaining({
          file: expect.stringContaining('missing-location.invalid.md'),
          valid: false,
        }),
        expect.objectContaining({
          file: expect.stringContaining('multiple-arrows.invalid.md'),
          valid: false,
        }),
        expect.objectContaining({
          file: expect.stringContaining('nested-valid-shape.invalid.md'),
          valid: false,
        }),
        expect.objectContaining({
          file: expect.stringContaining('continuation.invalid.md'),
          valid: false,
        }),
      ]),
    );
  });
});

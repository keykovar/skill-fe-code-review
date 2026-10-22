import { afterAll } from 'vitest';
import { preFormatRoot } from '../../scripts/pre-format-baseline.mjs';

// Frozen suites use process.cwd(); forks keep this change out of other projects.
const original = process.cwd();
process.chdir(preFormatRoot);
afterAll(() => process.chdir(original));

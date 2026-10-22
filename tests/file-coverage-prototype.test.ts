import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { parseGitStatusInventory, validateFileCoverage } from '../evaluation/prototypes/file-coverage.mjs';
import { readText } from './test-utils';

interface CoverageDraft {
  mode: string;
  scopeKey: string;
  baseline: string | null;
  summary: {
    inventory: string;
    knownFiles: number;
    totalFiles: number | null;
    counts: Record<string, number>;
    fullyReviewed: boolean;
    inventoryGap?: string;
  };
  entries: Array<{
    path: string;
    state: string;
    reviewedLayers: string[];
    evidence?: string;
    remaining?: string;
  }>;
}

const fixture = JSON.parse(readText('evaluation/prototypes/file-coverage/cases.json')) as {
  context: { scopeKey: string; baseline: string | null; enumerationComplete: boolean };
  status: string;
  positive: CoverageDraft;
  negative: CoverageDraft;
};
const context = fixture.context;
const directories: string[] = [];
const errors = (result: ReturnType<typeof validateFileCoverage>) => result.errors.map(({ code }: { code: string }) => code);
const inventory = () => parseGitStatusInventory(fixture.status, context);
const positive = () => structuredClone(fixture.positive);

function git(directory: string, args: string[]) {
  const result = spawnSync('git', ['-C', directory, ...args], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
  return result.stdout;
}

afterEach(() => {
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe('file coverage inventory prototype', () => {
  test('parses actual Git output without writing to the inspected repository', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-file-coverage-'));
    directories.push(directory);
    git(directory, ['init', '--quiet']);
    git(directory, ['config', 'user.name', 'Evaluation Fixture']);
    git(directory, ['config', 'user.email', 'fixture@example.invalid']);
    for (const name of ['mixed.ts', 'before.ts', 'deleted.ts']) fs.writeFileSync(path.join(directory, name), 'original\n');
    git(directory, ['add', '.']);
    git(directory, ['-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', 'commit', '--quiet', '-m', 'synthetic baseline']);
    fs.writeFileSync(path.join(directory, 'mixed.ts'), 'staged\n');
    git(directory, ['add', 'mixed.ts']);
    fs.writeFileSync(path.join(directory, 'mixed.ts'), 'unstaged\n');
    git(directory, ['mv', 'before.ts', 'after name.ts']);
    fs.unlinkSync(path.join(directory, 'deleted.ts'));
    const unusual = ['line\nbreak.ts', 'tab\tname.ts', 'quote"name.ts', 'back\\slash.ts', '\u4e2d\u6587.ts', 'Case.ts', 'case.ts'];
    // Some macOS volumes are case insensitive; case identity is also tested below.
    for (const name of unusual) fs.writeFileSync(path.join(directory, name), 'export {};\n');
    const status = git(directory, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
    const indexBefore = fs.readFileSync(path.join(directory, '.git', 'index'));
    const result = parseGitStatusInventory(Buffer.from(status), { ...context, baseline: git(directory, ['rev-parse', 'HEAD']).trim() });
    expect(result.complete).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.files).toContainEqual({ path: 'mixed.ts', status: 'MM', layers: ['staged', 'unstaged'] });
    expect(result.files).toContainEqual({ path: 'after name.ts', oldPath: 'before.ts', status: 'R ', layers: ['staged'] });
    expect(result.files).toContainEqual({ path: 'deleted.ts', status: ' D', layers: ['unstaged'] });
    for (const name of unusual.slice(0, -2)) expect(result.files).toContainEqual({ path: name, status: '??', layers: ['untracked'] });
    expect(fs.readFileSync(path.join(directory, '.git', 'index'))).toEqual(indexBefore);
    expect(git(directory, ['status', '--porcelain=v1', '-z', '--untracked-files=all'])).toBe(status);
  });

  test('preserves exact case and consumes rename pairs instead of splitting paths', () => {
    const result = parseGitStatusInventory('R  new -> name.ts\0old\nname.ts\0?? Case.ts\0?? case.ts\0', context);
    expect(result.complete).toBe(true);
    expect(result.files.map((file: { path: string }) => file.path)).toEqual(['new -> name.ts', 'Case.ts', 'case.ts']);
    expect(result.files[0].oldPath).toBe('old\nname.ts');
  });

  test.each([
    ['truncated record', ' M a.ts\0 M b', 'unterminated-status'],
    ['truncated rename', 'R  renamed.ts\0', 'missing-original-path'],
    ['newline status instead of NUL', ' M a.ts\n', 'unterminated-status'],
    ['duplicate path', ' M a.ts\0 M a.ts\0', 'duplicate-path'],
    ['invalid record', 'bogus\0', 'invalid-status-record'],
    ['outside path', ' M ../secret\0', 'invalid-path'],
    ['absolute path', ' M /secret\0', 'invalid-path'],
    ['unmerged change', 'UU src/a.ts\0', 'unmerged-status'],
    ['two rename layers', 'RR src/b.ts\0src/a.ts\0', 'ambiguous-rename-layers'],
  ])('does not call %s a complete inventory', (_name, status, issue) => {
    const result = parseGitStatusInventory(status, context);
    expect(result.complete).toBe(false);
    expect(result.issues).toContain(issue);
  });

  test('keeps known complete records as a lower bound after output truncation', () => {
    const result = parseGitStatusInventory(' M known.ts\0 M truncated', context);
    expect(result.files.map((file: { path: string }) => file.path)).toEqual(['known.ts']);
    expect(result.complete).toBe(false);
  });

  test('rejects invalid UTF-8 instead of replacing bytes in file identity', () => {
    const result = parseGitStatusInventory(Buffer.from([0x3f, 0x3f, 0x20, 0xff, 0]), context);
    expect(result).toMatchObject({ complete: false, files: [], issues: ['invalid-status-encoding'] });
  });

  test('requires explicit comparison and enumeration evidence', () => {
    expect(() => parseGitStatusInventory('', {})).toThrow(TypeError);
    expect(parseGitStatusInventory('', context)).toMatchObject({ complete: true, files: [] });
    expect(parseGitStatusInventory(' M a.ts\0', { ...context, baseline: null, enumerationComplete: false }))
      .toMatchObject({ complete: false, issues: ['enumeration-incomplete', 'baseline-unavailable'] });
  });
});

describe('file coverage accounting prototype', () => {
  test('accepts the honest incomplete-review fixture and rejects the self-consistent omission', () => {
    expect(validateFileCoverage(inventory(), fixture.positive)).toEqual({ valid: true, errors: [] });
    const result = validateFileCoverage(inventory(), fixture.negative);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      { code: 'missing-entry', path: 'src/generated-api.ts' },
      { code: 'missing-entry', path: 'assets/status.png' },
      { code: 'known-count-mismatch' },
      { code: 'full-coverage-mismatch' },
    ]));
  });

  test('accepts complete accounting without claiming semantic correctness', () => {
    const draft = positive();
    const data = inventory();
    draft.mode = 'deep';
    draft.entries = data.files.map((file: { path: string; layers: string[] }) => ({
      path: file.path, state: 'Reviewed', reviewedLayers: file.layers, evidence: 'An assertion still requiring independent semantic adjudication.',
    }));
    draft.summary.counts = { Reviewed: 3, Partial: 0, Deferred: 0, 'Cannot Verify': 0 };
    draft.summary.fullyReviewed = true;
    expect(validateFileCoverage(data, draft).valid).toBe(true);
  });

  test.each<[string, (draft: CoverageDraft) => void, string]>([
    ['duplicate entry', (draft) => draft.entries.push(structuredClone(draft.entries[0])), 'duplicate-entry'],
    ['extra unchanged consumer', (draft) => draft.entries.push({ ...draft.entries[0], path: 'src/consumer.ts' }), 'out-of-scope-path'],
    ['wrong comparison', (draft) => { draft.scopeKey = 'other:staged-only'; }, 'comparison-mismatch'],
    ['wrong baseline', (draft) => { draft.baseline = 'other-head'; }, 'comparison-mismatch'],
    ['wrong count', (draft) => { draft.summary.counts.Partial = 2; }, 'state-count-mismatch'],
    ['extra type count', (draft) => { draft.summary.counts.Generated = 1; }, 'state-count-mismatch'],
    ['generated used as state', (draft) => { draft.entries[1].state = 'Generated'; }, 'invalid-state'],
    ['gap without reason', (draft) => { draft.entries[1].remaining = ''; }, 'missing-gap-reason'],
    ['partial without evidence', (draft) => { draft.entries[0].evidence = ''; }, 'missing-partial-evidence'],
    ['unexpected review layer', (draft) => { draft.entries[0].reviewedLayers = ['untracked']; }, 'invalid-reviewed-layers'],
    ['duplicate review layer', (draft) => { draft.entries[0].reviewedLayers = ['staged', 'staged']; }, 'invalid-reviewed-layers'],
    ['deferred but already started', (draft) => { draft.entries[1].reviewedLayers = ['unstaged']; }, 'deferred-after-review'],
    ['Fix expansion', (draft) => { draft.mode = 'fix'; }, 'fix-coverage-forbidden'],
  ])('rejects %s', (_name, mutate, code) => {
    const draft = positive();
    mutate(draft);
    const result = validateFileCoverage(inventory(), draft);
    expect(result.valid).toBe(false);
    expect(errors(result)).toContain(code);
  });

  test('does not count a staged-only examination as full review of a mixed file', () => {
    const draft = positive();
    draft.entries[0].state = 'Reviewed';
    delete draft.entries[0].remaining;
    draft.summary.counts.Reviewed = 1;
    draft.summary.counts.Partial = 0;
    expect(errors(validateFileCoverage(inventory(), draft))).toContain('unsupported-reviewed');
  });

  test('accepts a lower bound only when incomplete inventory and its gap remain explicit', () => {
    const data = parseGitStatusInventory(fixture.status, { ...context, enumerationComplete: false });
    const draft = positive();
    draft.summary.inventory = 'Incomplete';
    draft.summary.totalFiles = null;
    draft.summary.inventoryGap = 'The supplied file enumeration was truncated.';
    expect(validateFileCoverage(data, draft).valid).toBe(true);
    draft.summary.totalFiles = 3;
    expect(errors(validateFileCoverage(data, draft))).toContain('total-count-mismatch');
    draft.summary.totalFiles = null;
    draft.summary.fullyReviewed = true;
    expect(errors(validateFileCoverage(data, draft))).toContain('full-coverage-mismatch');
    delete draft.summary.inventoryGap;
    expect(errors(validateFileCoverage(data, draft))).toContain('missing-inventory-gap');
  });

  test('rejects malformed inventories and duplicate oracle paths', () => {
    expect(validateFileCoverage(null, positive()).valid).toBe(false);
    const data = inventory();
    data.files.push(structuredClone(data.files[0]));
    expect(errors(validateFileCoverage(data, positive()))).toContain('duplicate-inventory-path');
  });

  test('accepts an empty known scope without manufacturing review entries', () => {
    const data = parseGitStatusInventory('', context);
    const draft = positive();
    draft.entries = [];
    draft.summary = {
      inventory: 'Complete', knownFiles: 0, totalFiles: 0,
      counts: { Reviewed: 0, Partial: 0, Deferred: 0, 'Cannot Verify': 0 }, fullyReviewed: true,
    };
    expect(validateFileCoverage(data, draft).valid).toBe(true);
  });

  test('uses the supplied narrow manifest, not a larger repository denominator', () => {
    const data = inventory();
    data.scopeKey = 'packet-01:selected-source-only';
    data.files = [data.files[0]];
    const draft = positive();
    draft.scopeKey = data.scopeKey;
    draft.entries = [draft.entries[0]];
    draft.summary.knownFiles = 1;
    draft.summary.totalFiles = 1;
    draft.summary.counts = { Reviewed: 0, Partial: 1, Deferred: 0, 'Cannot Verify': 0 };
    expect(validateFileCoverage(data, draft).valid).toBe(true);
    draft.entries.push(positive().entries[1]);
    expect(errors(validateFileCoverage(data, draft))).toContain('out-of-scope-path');
  });

  test('cannot approve full coverage after a missing baseline or observed mutation', () => {
    const data = inventory();
    data.complete = false;
    data.baseline = null;
    data.issues = ['baseline-unavailable', 'observed-source-mutation'];
    const draft = positive();
    draft.baseline = null;
    draft.summary.inventory = 'Incomplete';
    draft.summary.totalFiles = null;
    draft.summary.inventoryGap = 'Baseline unavailable; independent observation detected a changed source snapshot.';
    expect(validateFileCoverage(data, draft).valid).toBe(true);
    draft.entries[0].state = 'Reviewed';
    draft.entries[0].reviewedLayers = ['staged', 'unstaged'];
    delete draft.entries[0].remaining;
    expect(errors(validateFileCoverage(data, draft))).toContain('unsupported-reviewed');
  });

  test('does not mutate either source inventory or draft while reporting failures', () => {
    const data = inventory();
    const draft = structuredClone(fixture.negative);
    const before = JSON.stringify({ data, draft });
    validateFileCoverage(data, draft);
    expect(JSON.stringify({ data, draft })).toBe(before);
  });
});

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { exists, readText, rootDir } from './test-utils';

type FixtureMode =
  | 'quick'
  | 'deep'
  | 'deep-identity'
  | 'fix'
  | 'quick-independent'
  | 'quick-identity'
  | 'quick-keep'
  | 'fix-identity';

interface PreparedFixture {
  branch: string;
  caseName: string;
  expectedTestResult: 'pass' | 'fail';
  mode: FixtureMode;
  oracle: Record<string, unknown>;
  prompt: string;
  status: string[];
  targetDir: string;
  testCommand: string;
}

const temporaryDirectories: string[] = [];
const prepareScript = path.join(rootDir, 'scripts', 'prepare-evaluation-fixture.mjs');

function run(command: string, args: string[], cwd = rootDir) {
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, LANG: 'C', LC_ALL: 'C' },
  });
}

function prepare(mode: FixtureMode): PreparedFixture {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), `fe-code-review-${mode}-test-`));
  temporaryDirectories.push(targetDir);

  const result = run(process.execPath, [prepareScript, mode, '--output', targetDir]);
  expect(result.status, result.stderr).toBe(0);

  return JSON.parse(result.stdout) as PreparedFixture;
}

function git(targetDir: string, args: string[]): string {
  const result = run('git', args, targetDir);
  expect(result.status, result.stderr).toBe(0);
  return result.stdout.trim();
}

afterEach(() => {
  for (const targetDir of temporaryDirectories.splice(0)) {
    fs.rmSync(targetDir, { force: true, recursive: true });
  }
});

describe('reproducible evaluation fixtures', () => {
  test('defines machine-readable Quick, Deep, and Fix oracles without changing the skill contract', () => {
    const urlCase = JSON.parse(
      readText('evaluation/fixtures/url-regression/case.json'),
    ) as { modes: Record<string, unknown> };
    const deepCase = JSON.parse(
      readText('evaluation/fixtures/deep-session-ownership/case.json'),
    ) as {
      modes: {
        deep: {
          expectedDesignDecision: string;
        };
      };
    };

    expect(Object.keys(urlCase.modes)).toEqual([
      'quick',
      'quick-identity',
      'fix',
      'fix-identity',
    ]);
    expect(Object.keys(deepCase.modes)).toEqual(['deep', 'deep-identity']);
    expect(deepCase.modes.deep.expectedDesignDecision).toBe('Simplify');
    expect(exists('evaluation/fixtures/url-regression/previous-findings.md')).toBe(true);
    expect(exists('evaluation/fixtures/url-regression/previous-findings.identity.md')).toBe(true);
    expect(exists('evaluation/fixtures/independent-findings/case.json')).toBe(true);
    expect(exists('evaluation/fixtures/no-clear-issue/case.json')).toBe(true);
    expect(readText('skills/fe-code-review/SKILL.md')).not.toContain('evaluation/fixtures');
    const evaluation = readText('docs/evaluation.md');
    expect(evaluation).toContain('pnpm fixture:prepare quick');
    expect(evaluation).toContain(
      'pnpm fixture:prepare quick --output /private/tmp/fe-code-review-quick',
    );
    expect(evaluation).not.toContain('pnpm fixture:prepare quick -- --output');
    expect(readText('docs/evaluation.md')).toContain('Do not compare complete model text');
    expect(readText('docs/roadmap.md')).toContain('## Completed v0.2.1 Promotion Evidence');
    expect(readText('CHANGELOG.md')).toContain('reproducible Quick, Deep, and Fix evaluation fixtures');
    expect(exists('docs/evaluation-results/v0.2.0-post-release.md')).toBe(true);
    expect(exists('docs/evaluation-results/v0.2.1.md')).toBe(true);
    expect(exists('docs/evaluation-results/v0.3.0-post-release.md')).toBe(true);
    expect(exists('docs/evaluation-results/v0.4.0-post-release.md')).toBe(true);
  });

  test('retains Candidate 02 evidence and records the Candidate 03 runtime boundary', () => {
    const plan = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-ledger-completeness-candidate-02-plan.json',
      ),
    ) as {
      architectureDecision: { selected: string };
      allowedImplementation: { maxNetSkillEnglishWords: number; modeReferenceChanges: number };
      runtimeWindow: {
        stage1: { runOrder: string[] };
        totalSourceBearingRuns: number;
      };
      status: string;
      temporaryArtifactCleanup: {
        itemsDeleted: number;
        remainingPrefixMatches: number;
        status: string;
      };
    };
    const evaluationPlan = readText(
      'docs/post-v0.4.0-ledger-completeness-evaluation-plan.md',
    );
    const candidate01 = readText(
      'docs/evaluation-results/post-v0.4.0-ledger-tally-candidate-01.md',
    );
    const candidate02Probe = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-ledger-completeness-candidate-02-probe-result.json',
      ),
    ) as { status: string };

    expect(plan.status).toBe('complete-no-go-stage-1-stopped-after-run-01');
    expect(plan.architectureDecision.selected).toBe('prompt-only');
    expect(plan.allowedImplementation).toEqual(
      expect.objectContaining({ maxNetSkillEnglishWords: 60, modeReferenceChanges: 0 }),
    );
    expect(plan.runtimeWindow.totalSourceBearingRuns).toBe(7);
    expect(plan.runtimeWindow.stage1.runOrder).toEqual([
      'Q-ID-001 RUN-01',
      'Q-ID-001 RUN-02',
    ]);
    expect(evaluationPlan).toContain(
      'The corrected login and every frozen Cursor command set `AGENT_CLI_CREDENTIAL_STORE=file`',
    );
    expect(evaluationPlan).toContain(
      'Without a predeclared semantic oracle, it cannot know which real defect the model omitted',
    );
    expect(evaluationPlan).toContain(
      '[probe result](../evaluation/runtime-windows/post-v0.4.0-ledger-completeness-candidate-02-probe-result.json)',
    );
    expect(candidate01).toContain('Required-finding recall was therefore `2 / 3`');
    expect(candidate01).toContain('Candidate 01 is `No-Go`');
    expect(candidate01).toContain('all four Candidate 01 probe');
    expect(candidate02Probe.status).toBe(
      'pass-historical-source-free-precondition-superseded-by-candidate-no-go',
    );
    expect(plan.temporaryArtifactCleanup).toEqual(
      expect.objectContaining({ itemsDeleted: 11, remainingPrefixMatches: 0, status: 'complete' }),
    );
    const candidate02 = readText(
      'docs/evaluation-results/post-v0.4.0-ledger-completeness-candidate-02.md',
    );
    const reconciliationDesign = readText(
      'docs/post-v0.4.0-ledger-reconciliation-design.md',
    );
    const candidate03 = JSON.parse(
      readText('evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-03-plan.json'),
    ) as {
      rollback: {
        closureValidation: { vitestTests: string };
        installedSkillHashMatchesStable: boolean;
        status: string;
      };
      retainedEvaluatorTooling: {
        publicReviewOutputValidatorImportsModule: boolean;
        requiresFileLineLocations: boolean;
        targetedTests: string;
      };
      temporaryArtifactCleanup: {
        remainingPrefixMatches: number;
        repositoryEvidenceRetained: boolean;
        status: string;
      };
      runtimeFreezePrerequisites: {
        isolatedSourceFreeProbe: string;
        sourceBearingRuns: string;
      };
      runtimeWindow: { stage1: { runOrder: string[] } };
      status: string;
    };
    const candidate03Probe = JSON.parse(
      readText('evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-03-probe-result.json'),
    ) as { status: string };
    const groupedReplay = JSON.parse(
      readText('evaluation/prototypes/grouped-ledger-replay-result.json'),
    ) as {
      evidenceBoundary: { scope: string };
      migrationBrief: { hashScope: string };
    };
    const groupedPrototype = JSON.parse(
      readText('evaluation/prototypes/grouped-ledger-prototype-result.json'),
    ) as {
      implementation: {
        retainedEvaluator: {
          publicReviewOutputValidatorImportsModule: boolean;
          tests: string;
          validator: string;
        };
      };
    };
    expect(candidate02).toContain('The semantic oracle passed completely');
    expect(candidate02).toContain('Candidate 02 is `No-Go`');
    expect(reconciliationDesign).toContain(
      'Status: Candidate 03 `No-Go`; Stage 1 stopped after invalid D-ID-001 RUN-01; rolled back to stable v0.4.0',
    );
    expect(reconciliationDesign).toContain(
      'Group conditions under one Finding-owned merge basis | Select for offline prototype',
    );
    expect(
      exists('evaluation/prototypes/grouped-ledger-prototype-result.json'),
    ).toBe(true);
    expect(exists('evaluation/prototypes/grouped-ledger-replay-result.json')).toBe(true);
    const migrationBrief = readText(
      'docs/post-v0.4.0-grouped-ledger-migration-brief.md',
    );
    expect(migrationBrief).toContain(
      'Status: Candidate 03 `No-Go`; Stage 1 stopped after invalid D-ID-001 RUN-01; rolled back to stable v0.4.0',
    );
    expect(migrationBrief).toContain('| Quick + Deep | 1362 | 1438 | +76 | +80 |');
    expect(candidate03.status).toBe(
      'complete-no-go-rolled-back-to-v0.4.0',
    );
    expect(candidate03.rollback.status).toBe('complete');
    expect(candidate03.rollback.installedSkillHashMatchesStable).toBe(true);
    expect(candidate03.rollback.closureValidation.vitestTests).toBe('127/127');
    expect(candidate03.retainedEvaluatorTooling).toEqual(
      expect.objectContaining({
        publicReviewOutputValidatorImportsModule: false,
        requiresFileLineLocations: true,
        targetedTests: '15/15',
      }),
    );
    expect(candidate03.temporaryArtifactCleanup).toEqual(
      expect.objectContaining({
        remainingPrefixMatches: 0,
        repositoryEvidenceRetained: true,
        status: 'complete',
      }),
    );
    expect(candidate03.runtimeFreezePrerequisites.isolatedSourceFreeProbe).toBe(
      'pass',
    );
    expect(candidate03.runtimeFreezePrerequisites).toEqual(
      expect.objectContaining({ sourceBearingRuns: 'executed-1-invalid-stop-no-retry' }),
    );
    expect(candidate03.runtimeWindow.stage1.runOrder).toEqual([
      'D-ID-001 RUN-01',
      'Q-ID-001 RUN-01',
      'Q-ID-001 RUN-02',
    ]);
    expect(candidate03Probe.status).toBe(
      'pass-historical-source-free-precondition-superseded-by-candidate-no-go',
    );
    expect(groupedReplay.evidenceBoundary.scope).toBe(
      'initial-saved-replay-execution-before-candidate-freeze',
    );
    expect(groupedReplay.migrationBrief.hashScope).toContain('Candidate 03 No-Go');
    expect(groupedPrototype.implementation.retainedEvaluator).toEqual(
      expect.objectContaining({
        publicReviewOutputValidatorImportsModule: false,
        tests: 'tests/grouped-ledger-validator.test.ts',
        validator: 'scripts/grouped-ledger-validator.mjs',
      }),
    );
    expect(
      exists('evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-03-stage-1-results.json'),
    ).toBe(true);
    expect(
      exists(
        'evaluation/runtime-windows/post-v0.4.0-ledger-completeness-candidate-02-probe-result.json',
      ),
    ).toBe(true);
    expect(
      exists(
        'evaluation/runtime-windows/post-v0.4.0-ledger-completeness-candidate-02-stage-1-results.json',
      ),
    ).toBe(true);
  });

  test('rebuilds the frozen grouped-ledger candidate from the stable runtime', () => {
    const countEnglishWords = (value: string) =>
      value.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g)?.length ?? 0;
    const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
    const replaceExactlyOnce = (value: string, before: string, after: string) => {
      const occurrences = value.split(before).length - 1;
      expect(occurrences, `expected one occurrence of ${JSON.stringify(before)}`).toBe(1);
      return value.replace(before, after);
    };
    const applyModeReplacements = (value: string) => {
      const renderingBefore =
        'Apply the `Finding Requirements` finalization sequence before rendering. Keep discovery keys and acceptance sentences internal; expose the ledger only after final IDs are backfilled. Render each independently assessable changed condition, return-value contract, or observable behavior in its own `before -> after` entry, ending in one final Finding ID, `Behavior Preserving`, or `Cannot Verify`. Never summarize independent changes. Complete the repeated-ID ledger check in `SKILL.md` before responding.';
      const renderingAfter =
        'Apply the `Finding Requirements` finalization sequence before rendering. Keep discovery keys and acceptance sentences internal; expose the ledger only after final IDs are backfilled. Render one group per final Finding ID, `Behavior Preserving`, or `Cannot Verify`, then place every independently assessable changed condition, return-value contract, or observable behavior under its group as a separate `before -> after` entry. Never summarize independent changes. Apply the group-owned merge-basis rule in `SKILL.md` before responding.';
      const chineseBefore =
        '- [file:line] 条件：修改前 -> 修改后；结论：[F-001] / Behavior Preserving：行为保持 / Cannot Verify：无法验证；合并依据：<仅重复 ID 时填写同一简短键>';
      const chineseAfter = `- [F-001]
  - 合并依据：<仅多个条件确属同一原子修复时填写一次；单条件省略>
  - [file:line] 条件：修改前 -> 修改后
- Behavior Preserving：行为保持
  - [file:line] 条件：修改前 -> 修改后
- Cannot Verify：无法验证
  - [file:line] 条件：修改前 -> 修改后`;
      const evidenceBefore = ' Under `Evidence`, distinguish';
      const evidenceAfter =
        ' Under `Changed-Condition Coverage`, render each disposition once as a group; use one `Merge basis` only for a multi-condition Finding group and keep every child as a located `before -> after` entry. Under `Evidence`, distinguish';

      return replaceExactlyOnce(
        replaceExactlyOnce(
          replaceExactlyOnce(value, renderingBefore, renderingAfter),
          chineseBefore,
          chineseAfter,
        ),
        evidenceBefore,
        evidenceAfter,
      );
    };
    const baseline = {
      deep: readText('skills/fe-code-review/references/deep-review.md'),
      fix: readText('skills/fe-code-review/references/fix-review.md'),
      quick: readText('skills/fe-code-review/references/quick-review.md'),
      skill: readText('skills/fe-code-review/SKILL.md'),
    };
    const skillBefore =
      'Backfill final IDs into the visible ledger and cross-section references. Group ledger entries by final ID: repeated IDs require the same non-empty `Merge key` / `合并依据` on every entry; single IDs require none. Reconcile every actionable statement outside severity sections: reference a final ID or remove it.';
    const skillAfter =
      'Backfill final IDs into visible ledger groups and cross-section references. Render each final ID once as a group containing its changed conditions. A multi-condition Finding group requires one non-empty `Merge basis` / `合并依据` stating the indivisible repair or acceptance result; omit it for single-condition and non-Finding groups. Reconcile every actionable statement outside severity sections: reference a final ID or remove it.';
    const candidate = {
      deep: applyModeReplacements(baseline.deep),
      fix: baseline.fix,
      quick: applyModeReplacements(baseline.quick),
      skill: replaceExactlyOnce(baseline.skill, skillBefore, skillAfter),
    };

    expect({
      deep: { hash: hash(baseline.deep), words: countEnglishWords(baseline.deep) },
      fix: { hash: hash(baseline.fix), words: countEnglishWords(baseline.fix) },
      quick: { hash: hash(baseline.quick), words: countEnglishWords(baseline.quick) },
      skill: { hash: hash(baseline.skill), words: countEnglishWords(baseline.skill) },
    }).toEqual({
      deep: {
        hash: '9fef69f9db11cc846ad3cb2231f1ede1307227df83465ee8e3404cb5e6fcc276',
        words: 719,
      },
      fix: {
        hash: '8380289a00f3c2f1a1ea740bc824b1a53813d6839b3957cae3c54c0e27757d33',
        words: 519,
      },
      quick: {
        hash: '3d8d775387ff91d7fffd5711957a0af13b2f9d52d4036f4214c1d208c0a58d17',
        words: 643,
      },
      skill: {
        hash: '6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286',
        words: 3766,
      },
    });

    expect({
      deep: {
        hash: hash(candidate.deep),
        net: countEnglishWords(candidate.deep) - 719,
      },
      fix: {
        hash: hash(candidate.fix),
        net: countEnglishWords(candidate.fix) - 519,
      },
      quick: {
        hash: hash(candidate.quick),
        net: countEnglishWords(candidate.quick) - 643,
      },
      skill: {
        hash: hash(candidate.skill),
        net: countEnglishWords(candidate.skill) - 3766,
      },
    }).toEqual({
      deep: {
        hash: '44d1fb20cfc2f3b9814943d5254e2349387a8b17832eab27b618a2a2a3bedc36',
        net: 38,
      },
      fix: {
        hash: '8380289a00f3c2f1a1ea740bc824b1a53813d6839b3957cae3c54c0e27757d33',
        net: 0,
      },
      quick: {
        hash: '91fe031195f6018ecbf29c48aab5fc26477f9262b40eb7dd4d149b2294c7a9ed',
        net: 38,
      },
      skill: {
        hash: 'a8b81157abe92c944143a28386ffd9f86c25711ee7ab40d17e2ea0b6a514cb7e',
        net: 14,
      },
    });
  });

  test('prepares the Quick fixture with the seeded untracked dependency and behavior regression', () => {
    const baselineResult = run(
      process.execPath,
      ['--test'],
      path.join(rootDir, 'evaluation', 'fixtures', 'url-regression', 'baseline'),
    );
    expect(baselineResult.status, `${baselineResult.stdout}\n${baselineResult.stderr}`).toBe(0);

    const prepared = prepare('quick');

    expect(prepared.caseName).toBe('url-regression');
    expect(prepared.branch).toBe('main');
    expect(prepared.status).toEqual([' M src/url.ts', '?? src/request-config.ts']);
    expect(prepared.expectedTestResult).toBe('fail');
    expect(git(prepared.targetDir, ['ls-files', 'src/request-config.ts'])).toBe('');
    expect(
      fs.existsSync(path.join(prepared.targetDir, '.agents', 'skills', 'fe-code-review', 'SKILL.md')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(prepared.targetDir, '.cursor', 'skills', 'fe-code-review', 'SKILL.md')),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(prepared.targetDir, '.agents', 'skills', 'fe-code-review', '.plugin-eval'),
      ),
    ).toBe(false);
    expect(
      fs.existsSync(
        path.join(prepared.targetDir, '.cursor', 'skills', 'fe-code-review', '.plugin-eval'),
      ),
    ).toBe(false);

    const testResult = run(process.execPath, ['--test'], prepared.targetDir);
    expect(testResult.status).toBe(1);
    expect(`${testResult.stdout}\n${testResult.stderr}`).toContain(
      'https://api.example.com///users/42',
    );
  });

  test('prepares the Fix fixture with tracked dependencies and passing behavior', () => {
    const prepared = prepare('fix');

    expect(prepared.caseName).toBe('url-regression');
    expect(prepared.branch).toBe('main');
    expect(prepared.status).toEqual([' M src/url.ts']);
    expect(prepared.expectedTestResult).toBe('pass');
    expect(git(prepared.targetDir, ['ls-files', 'src/request-config.ts'])).toBe(
      'src/request-config.ts',
    );
    expect(fs.existsSync(path.join(prepared.targetDir, '.evaluation', 'previous-findings.md'))).toBe(
      true,
    );

    const testResult = run(process.execPath, ['--test'], prepared.targetDir);
    expect(testResult.status, `${testResult.stdout}\n${testResult.stderr}`).toBe(0);
  });

  test('prepares the independent-Finding Quick fixture with two distinct regressions', () => {
    const baselineDir = path.join(
      rootDir,
      'evaluation',
      'fixtures',
      'independent-findings',
      'baseline',
    );
    const baselineResult = run(process.execPath, ['--test'], baselineDir);
    expect(baselineResult.status, `${baselineResult.stdout}\n${baselineResult.stderr}`).toBe(0);

    const prepared = prepare('quick-independent');

    expect(prepared.caseName).toBe('independent-findings');
    expect(prepared.status).toEqual([' M src/cache-key.ts', ' M src/request-options.ts']);
    expect(prepared.expectedTestResult).toBe('fail');
    expect(prepared.oracle).toMatchObject({
      expectedIndependentFindingCount: 2,
      expectedFindings: [
        { expectedId: 'F-001', key: 'account-cache-key-collision' },
        { expectedId: 'F-002', key: 'ignored-timeout-contract' },
      ],
    });

    const testResult = run(process.execPath, ['--test'], prepared.targetDir);
    expect(testResult.status).toBe(1);
    expect(`${testResult.stdout}\n${testResult.stderr}`).toContain(
      'keeps profile cache entries isolated by account',
    );
    expect(`${testResult.stdout}\n${testResult.stderr}`).toContain(
      'preserves the timeout selected by the caller',
    );
  });

  test('prepares the ID-bearing Quick oracle without replacing the legacy Quick oracle', () => {
    const prepared = prepare('quick-identity');
    const caseDefinition = JSON.parse(
      readText('evaluation/fixtures/url-regression/case.json'),
    ) as { modes: Record<string, Record<string, unknown>> };

    expect(prepared.caseName).toBe('url-regression');
    expect(prepared.status).toEqual([' M src/url.ts', '?? src/request-config.ts']);
    expect(prepared.oracle).toMatchObject({
      expectedIndependentFindingCount: 3,
      expectedFindings: [
        { expectedId: 'F-001', key: 'referenced-untracked-file' },
        { expectedId: 'F-002', key: 'removed-slash-normalization' },
        { expectedId: 'F-003', key: 'ignored-base-url-contract' },
      ],
    });
    expect(caseDefinition.modes.quick.expectedIndependentFindingCount).toBeUndefined();
  });

  test('prepares the no-clear-issue Quick fixture with unchanged behavior', () => {
    const prepared = prepare('quick-keep');

    expect(prepared.caseName).toBe('no-clear-issue');
    expect(prepared.status).toEqual([' M src/label.ts']);
    expect(prepared.expectedTestResult).toBe('pass');
    expect(prepared.oracle).toMatchObject({
      expectedDesignDecision: 'Keep',
      expectedFindingIds: [],
      expectedFindings: [],
    });

    const testResult = run(process.execPath, ['--test'], prepared.targetDir);
    expect(testResult.status, `${testResult.stdout}\n${testResult.stderr}`).toBe(0);
  });

  test('prepares the ID-bearing Fix fixture without replacing the legacy report', () => {
    const prepared = prepare('fix-identity');
    const previousFindings = fs.readFileSync(
      path.join(prepared.targetDir, '.evaluation', 'previous-findings.md'),
      'utf8',
    );

    expect(prepared.caseName).toBe('url-regression');
    expect(prepared.status).toEqual([' M src/url.ts']);
    expect(prepared.expectedTestResult).toBe('pass');
    expect(previousFindings).toContain('## [F-001] Referenced untracked file');
    expect(previousFindings).toContain('## [F-003] Ignored base URL contract');
    expect(prepared.oracle).toMatchObject({
      expectedFindingStatuses: {
        'F-001': { key: 'referenced-untracked-file', status: 'Resolved' },
        'F-002': { key: 'removed-slash-normalization', status: 'Resolved' },
        'F-003': { key: 'ignored-base-url-contract', status: 'Resolved' },
      },
    });
    expect(readText('evaluation/fixtures/url-regression/previous-findings.md')).not.toContain(
      '[F-001]',
    );
  });

  test('prepares a clean Deep branch whose cross-module session regression is reproducible', () => {
    const baselineResult = run(
      process.execPath,
      ['--test'],
      path.join(rootDir, 'evaluation', 'fixtures', 'deep-session-ownership', 'baseline'),
    );
    expect(baselineResult.status, `${baselineResult.stdout}\n${baselineResult.stderr}`).toBe(0);

    const prepared = prepare('deep');

    expect(prepared.caseName).toBe('deep-session-ownership');
    expect(prepared.branch).toBe('candidate');
    expect(prepared.status).toEqual([]);
    expect(prepared.expectedTestResult).toBe('fail');
    expect(git(prepared.targetDir, ['diff', '--name-status', 'main...HEAD']).split('\n')).toEqual([
      'M\tsrc/profile/load-profile.ts',
      'A\tsrc/profile/profile-session.ts',
    ]);

    const testResult = run(process.execPath, ['--test'], prepared.targetDir);
    expect(testResult.status).toBe(1);
    expect(`${testResult.stdout}\n${testResult.stderr}`).toContain("actual: 'Bearer session-token'");
    expect(`${testResult.stdout}\n${testResult.stderr}`).toContain('expected: null');
  });

  test('prepares the ID-bearing Deep oracle without replacing the legacy Deep oracle', () => {
    const prepared = prepare('deep-identity');
    const caseDefinition = JSON.parse(
      readText('evaluation/fixtures/deep-session-ownership/case.json'),
    ) as { modes: Record<string, Record<string, unknown>> };

    expect(prepared.caseName).toBe('deep-session-ownership');
    expect(prepared.branch).toBe('candidate');
    expect(prepared.status).toEqual([]);
    expect(prepared.oracle).toMatchObject({
      expectedDesignDecision: 'Simplify',
      expectedFindings: [
        { expectedId: 'F-001', key: 'stale-profile-token-after-logout' },
      ],
    });
    expect(caseDefinition.modes.deep.expectedFindings).toEqual([
      {
        key: 'stale-profile-token-after-logout',
        allowedSeverities: ['Blocking', 'Risk'],
        evidence: [
          'src/auth/session.ts',
          'src/profile/profile-session.ts',
          'src/profile/load-profile.ts',
          'tests/session.test.mjs',
        ],
      },
    ]);
  });

  test('refuses to overwrite a non-empty output directory', () => {
    const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-code-review-non-empty-test-'));
    temporaryDirectories.push(targetDir);
    fs.writeFileSync(path.join(targetDir, 'keep.txt'), 'keep\n');

    const result = run(process.execPath, [prepareScript, 'quick', '--output', targetDir]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Output directory must be empty');
    expect(fs.readFileSync(path.join(targetDir, 'keep.txt'), 'utf8')).toBe('keep\n');
  });
});

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { restoreV040SkillSnapshot } from '../scripts/build-grouped-ledger-candidate.mjs';
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
  skillSource: string;
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

function prepareWithSkillSource(mode: FixtureMode, skillSource: string): PreparedFixture {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), `fe-code-review-${mode}-custom-test-`));
  temporaryDirectories.push(targetDir);

  const result = run(process.execPath, [
    prepareScript,
    mode,
    '--skill-source',
    skillSource,
    '--output',
    targetDir,
  ]);
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
    const restored = restoreV040SkillSnapshot({
      deep: readText('skills/fe-code-review/references/deep-review.md'),
      quick: readText('skills/fe-code-review/references/quick-review.md'),
      skill: readText('skills/fe-code-review/SKILL.md'),
    });
    const baseline = {
      deep: restored.deep,
      fix: readText('skills/fe-code-review/references/fix-review.md'),
      quick: restored.quick,
      skill: restored.skill,
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

  test('freezes Candidate 04 behind literal Prompt transport and separate runtime authorization', () => {
    const plan = JSON.parse(
      readText('evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-04-plan.json'),
    ) as {
      candidate: string;
      candidateBehavior: { appliedToPublicSkill: boolean; runtimeDeltaComparedWithCandidate03: string };
      finalStaticValidation: { status: string; vitestTests: string };
      offlineFreeze: { expectedTestResultsMatched: string; repeatPairsByteIdentical: string };
      preRuntimeStatus: {
        candidateRuntimeFilesApplied: boolean;
        sourceBearingRunsExecuted: number;
        sourceFreeProbeExecuted: boolean;
      };
      promptTransport: {
        promptSha256RequiredBeforeSpawn: boolean;
        runner: string;
        shell: boolean;
        targetedTestResult: string;
        transport: string;
      };
      sourcePolicy: {
        externalModelRequestAuthorized: boolean;
        privateSourceAllowed: boolean;
        sourceBearingAuthorized: boolean;
        sourceFreeProbeAuthorized: boolean;
        sourceFreeProbeCompleted: boolean;
      };
      sourceFreeProbe: {
        auditorValid: boolean;
        decodedResponse: string;
        sourceBearingAuthorized: boolean;
        sourceTransmitted: boolean;
        status: string;
        toolCalls: number;
        workspacesUnchanged: string;
      };
      stage1Attempt: {
        cursorProcessStarted: boolean;
        externalModelRequests: number;
        retryExecuted: boolean;
        runnerInvoked: boolean;
        sourceTransmitted: boolean;
        status: string;
      };
      status: string;
    };
    const planDocument = readText(
      'docs/post-v0.4.0-grouped-ledger-candidate-04-evaluation-plan.md',
    );
    const freeze = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-04-offline-freeze.json',
      ),
    ) as {
      preparedRuns: Array<{
        collectorRequired: boolean;
        expectedCollectorCalls: number;
        mode: string;
      }>;
      repeatAssertions: unknown[];
      sourcePolicy: { externalModelRequests: number; sourceTransmitted: boolean };
      status: string;
    };
    const probeResult = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-04-probe-result.json',
      ),
    ) as {
      authorization: { sourceBearingAuthorized: boolean };
      integrity: { preparedWorkspacesUnchanged: string; sourceTransmitted: boolean };
      probe: {
        auditorValid: boolean;
        decodedResponse: string;
        mcpCalls: number;
        toolCalls: number;
      };
      status: string;
    };
    const stage1Result = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-04-stage-1-result.json',
      ),
    ) as {
      attempt: {
        cursorProcessStarted: boolean;
        externalModelRequests: number;
        retryExecuted: boolean;
        runnerInvoked: boolean;
        sourceTransmitted: boolean;
      };
      sourceFreeProbe: {
        loginProcessExitCode: number;
        preparedWorkspaceTreesUnchanged: string;
        resultSha256: string;
        sourceFreeExternalRequestsExecuted: number;
        sourceFreeProbeExecuted: boolean;
        sourceTransmitted: boolean;
        status: string;
      };
      postStopIntegrity: { preparedWorkspaceTreesUnchanged: string };
      status: string;
    };

    expect(plan).toMatchObject({
      candidate: 'post-v0.4.0-grouped-ledger-candidate-04',
      status: 'no-go-stopped-before-source-bearing-client-start',
      candidateBehavior: {
        appliedToPublicSkill: false,
        runtimeDeltaComparedWithCandidate03: 'byte-identical',
      },
      promptTransport: {
        promptSha256RequiredBeforeSpawn: true,
        runner: 'scripts/run-cursor-evaluation.mjs',
        shell: false,
        targetedTestResult: '3/3 pass',
        transport: 'one literal final argv value',
      },
      sourcePolicy: {
        externalModelRequestAuthorized: true,
        privateSourceAllowed: false,
        sourceBearingAuthorized: false,
        sourceFreeProbeAuthorized: true,
        sourceFreeProbeCompleted: true,
      },
      preRuntimeStatus: {
        candidateRuntimeFilesApplied: false,
        sourceBearingRunsExecuted: 0,
        sourceFreeProbeExecuted: true,
      },
      sourceFreeProbe: {
        auditorValid: true,
        decodedResponse: 'CLIENT_ISOLATION_OK',
        sourceBearingAuthorized: false,
        sourceTransmitted: false,
        status: 'pass-historical-precondition-superseded-by-candidate-no-go',
        toolCalls: 0,
        workspacesUnchanged: '7/7',
      },
      stage1Attempt: {
        cursorProcessStarted: false,
        externalModelRequests: 0,
        retryExecuted: false,
        runnerInvoked: false,
        sourceTransmitted: false,
        status: 'no-go-stopped-before-source-bearing-client-start',
      },
      offlineFreeze: {
        expectedTestResultsMatched: '7/7',
        repeatPairsByteIdentical:
          '2/2 by HEAD, Prompt SHA-256, and complete workspace tree SHA-256',
      },
      finalStaticValidation: { status: 'pass', vitestTests: '134/134' },
    });
    expect(freeze).toMatchObject({
      status: 'offline-freeze-complete-runtime-not-authorized',
      sourcePolicy: { externalModelRequests: 0, sourceTransmitted: false },
    });
    expect(freeze.preparedRuns).toHaveLength(7);
    expect(freeze.repeatAssertions).toHaveLength(2);
    expect(probeResult).toMatchObject({
      status: 'pass-historical-precondition-superseded-by-candidate-no-go',
      authorization: { sourceBearingAuthorized: false },
      probe: {
        auditorValid: true,
        decodedResponse: 'CLIENT_ISOLATION_OK',
        mcpCalls: 0,
        toolCalls: 0,
      },
      integrity: { preparedWorkspacesUnchanged: '7/7', sourceTransmitted: false },
    });
    expect(stage1Result).toMatchObject({
      status: 'no-go-stopped-before-source-bearing-client-start',
      attempt: {
        cursorProcessStarted: false,
        externalModelRequests: 0,
        retryExecuted: false,
        runnerInvoked: false,
        sourceTransmitted: false,
      },
      postStopIntegrity: { preparedWorkspaceTreesUnchanged: '7/7' },
    });
    expect(
      freeze.preparedRuns.find(({ mode }) => mode === 'deep-identity'),
    ).toMatchObject({ collectorRequired: false, expectedCollectorCalls: 0 });
    expect(
      freeze.preparedRuns
        .filter(({ mode }) => mode !== 'deep-identity')
        .every(
          ({ collectorRequired, expectedCollectorCalls }) =>
            collectorRequired && expectedCollectorCalls === 1,
        ),
    ).toBe(true);
    expect(planDocument).toContain(
      'It does not retry, replace, or reinterpret Candidate 03.',
    );
    expect(planDocument).toContain(
      'Invoke the absolute Cursor executable with `spawnSync(executable, argv, { shell: false })`.',
    );
    expect(planDocument).toContain(
      'Deep Review must not invoke the context collector.',
    );
    expect(exists('scripts/run-cursor-evaluation.mjs')).toBe(true);
    expect(exists('tests/cursor-evaluation-runner.test.ts')).toBe(true);
  });

  test('builds the exact Candidate 03 grouped runtime delta without changing the public Skill', () => {
    const targetDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'fe-code-review-grouped-candidate-build-test-'),
    );
    temporaryDirectories.push(targetDir);
    const stableSkillBefore = crypto
      .createHash('sha256')
      .update(readText('skills/fe-code-review/SKILL.md'))
      .digest('hex');
    const result = run(process.execPath, [
      path.join(rootDir, 'scripts', 'build-grouped-ledger-candidate.mjs'),
      '--output',
      targetDir,
    ]);

    expect(result.status, result.stderr).toBe(0);
    const built = JSON.parse(result.stdout) as {
      hashes: Record<string, string>;
      words: Record<string, number>;
    };
    expect(built.hashes).toEqual({
      deep: '44d1fb20cfc2f3b9814943d5254e2349387a8b17832eab27b618a2a2a3bedc36',
      fix: '8380289a00f3c2f1a1ea740bc824b1a53813d6839b3957cae3c54c0e27757d33',
      groupedValidator: 'a0e429e9ea53dc94ff75d8e573b670e1cdcf30012d07ff31210a968515342998',
      quick: '91fe031195f6018ecbf29c48aab5fc26477f9262b40eb7dd4d149b2294c7a9ed',
      reviewOutputValidator:
        '0293481ada8e2c722730f02f2663244d3c446e4d0a46dd9c9bc63ed030e81b8f',
      skill: 'a8b81157abe92c944143a28386ffd9f86c25711ee7ab40d17e2ea0b6a514cb7e',
    });
    expect(built.words).toEqual({ deep: 757, fix: 519, quick: 681, skill: 3780 });
    expect(
      crypto
        .createHash('sha256')
        .update(readText('skills/fe-code-review/SKILL.md'))
        .digest('hex'),
    ).toBe(stableSkillBefore);
  });

  test('freezes Candidate 05 with Node-owned preflight and no carried runtime evidence', () => {
    const plan = JSON.parse(
      readText('evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-05-plan.json'),
    ) as {
      candidateBehavior: { appliedToPublicSkill: boolean; runtimeDeltaComparedWithCandidate04: string };
      offlineFreeze: { expectedTestResultsMatched: string; runtimeResultsCarriedForward: boolean };
      runner: {
        absoluteExecutablesRequired: boolean;
        adHocShellPreflightAllowed: boolean;
        shell: boolean;
        zshPathIndependent: boolean;
      };
      sourcePolicy: {
        externalModelRequestAuthorized: boolean;
        externalModelRequestsExecuted: number;
        privateSourceTransmitted: boolean;
        publicSyntheticSourceTransmitted: boolean;
        sourceBearingAuthorized: boolean;
        sourceBearingAttemptAuthorized: boolean;
        sourceBearingAttemptExecuted: boolean;
        sourceFreeProbeAuthorized: boolean;
        sourceTransmitted: boolean;
      };
      stage1Attempt: {
        candidateStructuralValidator: string;
        externalModelRequests: number;
        privateSourceTransmitted: boolean;
        promotionScored: boolean;
        publicSyntheticSourceTransmitted: boolean;
        result: string;
        resultSha256: string;
        retryExecuted: boolean;
        status: string;
      };
      status: string;
    };
    const freeze = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-05-offline-freeze.json',
      ),
    ) as {
      expectedTestResultsMatched: string;
      generationBoundary: {
        freshOutputDirectory: boolean;
        runtimeResultsCarriedForward: boolean;
      };
      preparedRuns: Array<{
        branch: string;
        head: string;
        preflight?: unknown;
        promptSha256: string;
        skillTreeSha256: string;
        statusSha256: string;
        workspaceTreeSha256: string;
      }>;
      repeatAssertions: unknown[];
      runner: { sha256: string };
      sourcePolicy: { externalModelRequests: number; sourceTransmitted: boolean };
      status: string;
    };
    const probeResult = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-05-probe-result.json',
      ),
    ) as {
      authorization: { sourceBearingAuthorized: boolean };
      integrity: { preparedWorkspacesUnchanged: string; sourceTransmitted: boolean };
      probe: {
        assistantMessages: number;
        auditorValid: boolean;
        decodedResponse: string;
        mcpCalls: number;
        initialSupplementalResponseParser: {
          assistantResponseExact: boolean;
          resultResponseExact: boolean;
        };
        toolCalls: number;
      };
      toolingReplay: {
        auditorSha256: string;
        finalResponseSha256: string;
        status: string;
      };
      status: string;
    };
    const planDocument = readText(
      'docs/post-v0.4.0-grouped-ledger-candidate-05-evaluation-plan.md',
    );
    const stage1Result = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-05-stage-1-result.json',
      ),
    ) as {
      clientContract: {
        earliestBlockingFailure: boolean;
        effectiveMode: string;
        requestedMode: string;
        status: string;
      };
      executionAudit: {
        auditorValid: boolean;
        collectorCallCount: number;
        declaredFixtureTestCalls: number;
        mcpCalls: number;
        workspaceStatusUnchanged: boolean;
      };
      reviewObservation: {
        candidateStructuralValidator: string;
        findingIdsRecognizedByValidator: string[];
        scoredForPromotion: boolean;
      };
      run: { assistantMessages: number; startedToolCalls: number };
      runtimeWindow: {
        remainingRunsExecuted: number;
        retryExecuted: boolean;
        sourceBearingRunsExecuted: number;
      };
      status: string;
      transferBoundary: {
        externalModelRequests: number;
        privateSourceTransmitted: boolean;
        publicSyntheticSourceTransmitted: boolean;
      };
    };

    expect(plan).toMatchObject({
      status: 'no-go-stage-1-stopped-after-run-01-client-contract-failure',
      candidateBehavior: {
        appliedToPublicSkill: false,
        runtimeDeltaComparedWithCandidate04: 'byte-identical',
      },
      runner: {
        absoluteExecutablesRequired: true,
        adHocShellPreflightAllowed: false,
        shell: false,
        zshPathIndependent: true,
      },
      offlineFreeze: {
        expectedTestResultsMatched: '7/7',
        runtimeResultsCarriedForward: false,
      },
      sourcePolicy: {
        externalModelRequestAuthorized: true,
        externalModelRequestsExecuted: 2,
        privateSourceTransmitted: false,
        publicSyntheticSourceTransmitted: true,
        sourceBearingAuthorized: false,
        sourceBearingAttemptAuthorized: true,
        sourceBearingAttemptExecuted: true,
        sourceFreeProbeAuthorized: true,
        sourceFreeProbeCompleted: true,
        sourceTransmitted: true,
      },
      staticValidation: {
        status: 'pass',
        vitest: '14/14 files and 141/141 tests',
        groupedLedgerReplay: '7/7',
      },
      sourceFreeTransferBoundary: {
        status: 'pass',
        expectedResponse: 'CLIENT_ISOLATION_OK',
        expectedToolCalls: 0,
        externalRequestAuthorized: true,
        privateSourceAllowed: false,
        reviewedSourceAllowed: false,
      },
      toolingGate: {
        status: 'pass',
        localReplayRequired: true,
        externalModelRequestRequired: false,
        candidateRuntimeBehaviorChanged: false,
        sourceBearingAuthorizationAllowedBeforePass: false,
      },
      stage1Attempt: {
        candidateStructuralValidator: 'fail-unscored-observation',
        externalModelRequests: 1,
        privateSourceTransmitted: false,
        promotionScored: false,
        publicSyntheticSourceTransmitted: true,
        result:
          'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-05-stage-1-result.json',
        retryExecuted: false,
        status: 'no-go-stage-1-stopped-after-run-01-client-contract-failure',
      },
    });
    expect(freeze).toMatchObject({
      status: 'offline-freeze-complete-runtime-not-authorized',
      expectedTestResultsMatched: '7/7',
      generationBoundary: {
        freshOutputDirectory: true,
        runtimeResultsCarriedForward: false,
      },
      runner: { sha256: '8d45c08beef54a86220ff7f995c3a2b8c88bbafa38382a9339d06137bb31e322' },
      sourcePolicy: { externalModelRequests: 0, sourceTransmitted: false },
    });
    expect(freeze.preparedRuns).toHaveLength(7);
    expect(freeze.repeatAssertions).toHaveLength(2);
    expect(probeResult).toMatchObject({
      status: 'pass-source-free-precondition-source-bearing-authorization-pending',
      authorization: { sourceBearingAuthorized: false },
      probe: {
        assistantMessages: 1,
        auditorValid: true,
        decodedResponse: 'CLIENT_ISOLATION_OK',
        mcpCalls: 0,
        initialSupplementalResponseParser: {
          assistantResponseExact: true,
          resultResponseExact: true,
        },
        toolCalls: 0,
      },
      integrity: { preparedWorkspacesUnchanged: '7/7', sourceTransmitted: false },
      toolingReplay: {
        status: 'pass',
        auditorSha256: 'db701d66786321997d94f25b79904c0c180e681ec963a1e37963ce1c6cfba21f',
        finalResponseSha256: '08d172bf341a620dbf1b9e55887d785beb2d93f92c73a17728f97012e1ef62ba',
      },
    });
    expect(stage1Result).toMatchObject({
      status: 'no-go-stage-1-stopped-after-run-01-client-contract-failure',
      run: { assistantMessages: 2, startedToolCalls: 18 },
      clientContract: {
        status: 'fail',
        requestedMode: 'auto-review',
        effectiveMode: 'Allowlist fallback',
        earliestBlockingFailure: true,
      },
      transferBoundary: {
        externalModelRequests: 1,
        publicSyntheticSourceTransmitted: true,
        privateSourceTransmitted: false,
      },
      executionAudit: {
        auditorValid: true,
        collectorCallCount: 0,
        declaredFixtureTestCalls: 1,
        mcpCalls: 0,
        workspaceStatusUnchanged: true,
      },
      reviewObservation: {
        scoredForPromotion: false,
        candidateStructuralValidator: 'fail',
        findingIdsRecognizedByValidator: [],
      },
      runtimeWindow: {
        sourceBearingRunsExecuted: 1,
        remainingRunsExecuted: 0,
        retryExecuted: false,
      },
    });
    expect(plan.stage1Attempt.resultSha256).toBe(
      crypto
        .createHash('sha256')
        .update(
          readText(
            'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-05-stage-1-result.json',
          ),
        )
        .digest('hex'),
    );
    expect(
      freeze.preparedRuns.every(
        ({ branch, head, promptSha256, skillTreeSha256, statusSha256, workspaceTreeSha256 }) =>
          branch.length > 0 &&
          /^[a-f0-9]{40}$/u.test(head) &&
          [promptSha256, skillTreeSha256, statusSha256, workspaceTreeSha256].every((hash) =>
            /^[a-f0-9]{64}$/u.test(hash),
          ),
      ),
    ).toBe(true);
    expect(planDocument).toContain('Ad hoc shell preflight is forbidden.');
    expect(planDocument).toContain('Candidate 05 is closed `No-Go`.');
    expect(planDocument).toContain('fell back to `Allowlist`');
    expect(planDocument).toContain('deterministically extracts Cursor `assistant/result`');
    expect(exists('scripts/run-cursor-evaluation-v2.mjs')).toBe(true);
    expect(exists('tests/cursor-evaluation-runner-v2.test.ts')).toBe(true);
  });

  test('freezes Candidate 06 as one rendering constraint and an explicit read-only client mode', () => {
    const plan = JSON.parse(
      readText('evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-06-plan.json'),
    ) as {
      clientContractDelta: {
        autoReviewRequested: boolean;
        candidate06ArgumentsBeforePrompt: string[];
        explicitMode: string;
        forbiddenFlags: string[];
        permissionFallbackAllowed: boolean;
      };
      implementationGate: {
        externalModelRequestAllowed: boolean;
        installedSkillApplicationAllowed: boolean;
        publicSkillApplicationAllowed: boolean;
        status: string;
      };
      offlineFreeze: {
        expectedTestResultsMatched: string;
        externalModelRequests: number;
        preparedWorkspaces: string;
        resultSha256: string;
        sourceFreeProbeExecuted: boolean;
        sourceTransmitted: boolean;
        status: string;
      };
      postStopClosure: {
        externalModelRequests: number;
        preparedWorkspaceTrees: string;
        sourceTransmitted: boolean;
        status: string;
        vitestFiles: string;
        vitestTests: string;
      };
      sourceFreeProbe: {
        loginProcessExitCode: number;
        preparedWorkspaceTreesUnchanged: string;
        resultSha256: string;
        sourceFreeExternalRequestsExecuted: number;
        sourceFreeProbeExecuted: boolean;
        sourceTransmitted: boolean;
        status: string;
      };
      runtimeSkillDelta: {
        actualNetSkillEnglishWords: number;
        candidateSkillSha256: string;
        exactInstruction: string;
        newVisibleOutputFields: number;
        quickReferenceNetWords: number;
        deepReferenceNetWords: number;
        fixReferenceNetWords: number;
        skillMdMaximumNetEnglishWords: number;
        validatorBehaviorChanged: boolean;
      };
      sourcePolicy: {
        externalModelRequestAuthorized: boolean;
        privateSourceAllowed: boolean;
        sourceTransmitted: boolean;
      };
      status: string;
    };
    const planDocument = readText(
      'docs/post-v0.4.0-grouped-ledger-candidate-06-evaluation-plan.md',
    );
    const freeze = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-06-offline-freeze.json',
      ),
    ) as {
      expectedTestResultsMatched: string;
      preparedRuns: Array<{ promptSha256: string; skillTreeSha256: string }>;
      repeatAssertions: unknown[];
      sourcePolicy: {
        externalModelRequests: number;
        sourceFreeProbeAuthorized: boolean;
        sourceTransmitted: boolean;
      };
      status: string;
    };
    const probeResult = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-06-probe-result.json',
      ),
    ) as {
      integrity: { preparedWorkspaceTreesUnchanged: string };
      login: { processExitCode: number; retryExecuted: boolean; status: string };
      probe: { clientProcessStarted: boolean; modelRequests: number; status: string };
      status: string;
    };

    expect(plan).toMatchObject({
      status: 'no-go-stopped-before-source-free-probe-login-failure',
      runtimeSkillDelta: {
        skillMdMaximumNetEnglishWords: 30,
        quickReferenceNetWords: 0,
        deepReferenceNetWords: 0,
        fixReferenceNetWords: 0,
        newVisibleOutputFields: 0,
        validatorBehaviorChanged: false,
        candidateSkillSha256:
          'a7145a6d305647c32ed47873b1284575152ff12c7ab61002cea108672dedfae1',
        actualNetSkillEnglishWords: 25,
      },
      clientContractDelta: {
        autoReviewRequested: false,
        explicitMode: 'ask',
        permissionFallbackAllowed: false,
        forbiddenFlags: ['--auto-review', '--force', '--yolo', '--approve-mcps'],
      },
      implementationGate: {
        status: 'pass-offline-runtime-not-authorized',
        publicSkillApplicationAllowed: false,
        installedSkillApplicationAllowed: false,
        externalModelRequestAllowed: false,
      },
      offlineFreeze: {
        status: 'pass-source-free-probe-not-authorized',
        preparedWorkspaces: '7/7',
        expectedTestResultsMatched: '7/7',
        externalModelRequests: 0,
        sourceTransmitted: false,
        sourceFreeProbeExecuted: false,
      },
      sourceFreeProbe: {
        status: 'no-go-stopped-before-source-free-probe-login-failure',
        loginProcessExitCode: 1,
        sourceFreeExternalRequestsExecuted: 0,
        sourceFreeProbeExecuted: false,
        sourceTransmitted: false,
        preparedWorkspaceTreesUnchanged: '7/7',
      },
      postStopClosure: {
        status: 'pass',
        vitestFiles: '17/17',
        vitestTests: '152/152',
        preparedWorkspaceTrees: '7/7 unchanged',
        externalModelRequests: 0,
        sourceTransmitted: false,
      },
      sourcePolicy: {
        privateSourceAllowed: false,
        externalModelRequestAuthorized: false,
        sourceTransmitted: false,
      },
    });
    expect(plan.runtimeSkillDelta.exactInstruction).toContain(
      'Render these prefixes literally, without bold, italics, or code wrappers',
    );
    expect(plan.clientContractDelta.candidate06ArgumentsBeforePrompt).toEqual([
      '--print',
      '--output-format',
      'stream-json',
      '--mode',
      'ask',
      '--sandbox',
      'enabled',
      '--trust',
      '--workspace',
      '<workspace>',
    ]);
    expect(freeze).toMatchObject({
      status: 'offline-freeze-complete-source-free-probe-not-authorized',
      expectedTestResultsMatched: '7/7',
      sourcePolicy: {
        externalModelRequests: 0,
        sourceFreeProbeAuthorized: false,
        sourceTransmitted: false,
      },
    });
    expect(freeze.preparedRuns).toHaveLength(7);
    expect(freeze.repeatAssertions).toHaveLength(2);
    expect(
      freeze.preparedRuns.every(
        ({ promptSha256, skillTreeSha256 }) =>
          /^[a-f0-9]{64}$/u.test(promptSha256) &&
          skillTreeSha256 ===
            '49fd77c07ccb214b4fe464b5019888ac496ca59fd52ba3c04cf8390e8627211d',
      ),
    ).toBe(true);
    expect(plan.offlineFreeze.resultSha256).toBe(
      crypto
        .createHash('sha256')
        .update(
          readText(
            'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-06-offline-freeze.json',
          ),
        )
        .digest('hex'),
    );
    expect(probeResult).toMatchObject({
      status: 'no-go-stopped-before-source-free-probe-login-failure',
      login: { status: 'fail', processExitCode: 1, retryExecuted: false },
      probe: { status: 'not-executed', clientProcessStarted: false, modelRequests: 0 },
      integrity: { preparedWorkspaceTreesUnchanged: '7/7' },
    });
    expect(plan.sourceFreeProbe.resultSha256).toBe(
      crypto
        .createHash('sha256')
        .update(
          readText(
            'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-06-probe-result.json',
          ),
        )
        .digest('hex'),
    );
    expect(planDocument).toContain('Do not use `--auto-review`, `--force`, `--yolo`');
    expect(planDocument).toContain('Preparation executed zero model requests');
    expect(planDocument).toContain('Post-stop closure passes `17 / 17` Vitest files');
    expect(planDocument).toContain('Candidate 06 is closed `No-Go`');
    expect(exists('scripts/build-grouped-ledger-candidate-06.mjs')).toBe(true);
    expect(exists('scripts/run-cursor-evaluation-v3.mjs')).toBe(true);
    expect(exists('scripts/prepare-grouped-ledger-candidate-06.mjs')).toBe(true);
    expect(exists('tests/grouped-candidate-06-builder.test.ts')).toBe(true);
    expect(exists('tests/cursor-evaluation-runner-v3.test.ts')).toBe(true);
    expect(exists('tests/grouped-candidate-06-preparer.test.ts')).toBe(true);
  });

  test('freezes Candidate 07 as a fresh runtime-only replacement window', () => {
    const plan = JSON.parse(
      readText('evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-07-plan.json'),
    ) as {
      lateLoginObservation: {
        recordedAsCandidate06RuntimeEvidence: boolean;
        recordedAsCandidate07RuntimeEvidence: boolean;
        userReportedBrowserLoginComplete: boolean;
      };
      offlineFreeze: {
        expectedTestResultsMatched: string;
        preparedWorkspaces: string;
        repeatPairsByteIdentical: string;
        sourceTransmitted: boolean;
        status: string;
      };
      runtimeCandidate: {
        clientContractChanged: boolean;
        deltaComparedWithCandidate06: string;
        skillBehaviorChanged: boolean;
        validatorBehaviorChanged: boolean;
      };
      postStopClosure: {
        preparedWorkspaceTrees: string;
        runtimeWindowExternalModelRequests: number;
        runtimeWindowPrivateSourceTransmitted: boolean;
        status: string;
        vitestFiles: string;
        vitestTests: string;
      };
      prospectiveRuntimeWindow: {
        stage1: { runsExecuted: string[]; runsStopped: string[] };
        stage2: { runsExecuted: string[]; status: string };
        status: string;
      };
      sourceFreeProbe: {
        assistantMessages: number;
        decodedResponse: string;
        externalModelRequests: number;
        freshIsolatedHomeRequired: boolean;
        mcpCalls: number;
        resultSha256: string;
        sourceFreeProbeExecuted: boolean;
        sourceTransmitted: boolean;
        status: string;
        toolCalls: number;
      };
      sourcePolicy: {
        externalModelRequests: number;
        privateSourceTransmitted: boolean;
        publicSyntheticSourceTransmitted: boolean;
        sourceBearingAttemptExecuted: boolean;
        sourceBearingAuthorized: boolean;
        sourceTransmitted: boolean;
      };
      stage1Attempt: {
        declaredFixtureTestCallsExpected: number;
        declaredFixtureTestCallsObserved: number;
        promotionScored: boolean;
        resultSha256: string;
        semanticOracleObservation: string;
        shellPermissionDenied: number;
        status: string;
        structuralErrorCount: number;
        structuralErrorTypes: string[];
      };
      status: string;
    };
    const probeResult = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-07-probe-result.json',
      ),
    ) as {
      integrity: {
        preparedWorkspaceTreesUnchanged: string;
        sourceFreeWorkspaceUnchanged: boolean;
      };
      login: { processExitCode: number; retryExecuted: boolean; status: string };
      probe: {
        decodedResponse: string;
        mcpCalls: number;
        processExitCode: number;
        sourceTransmitted: boolean;
        status: string;
        toolCalls: number;
      };
      status: string;
    };
    const stage1Result = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-07-stage-1-result.json',
      ),
    ) as {
      clientContract: {
        retried: boolean;
        shellPermissionDenied: number;
        status: string;
      };
      executionAudit: {
        declaredFixtureTestCallsExpected: number;
        declaredFixtureTestCallsObserved: number;
        preparedWorkspaceTreesUnchanged: string;
        workspaceStatusUnchanged: boolean;
      };
      reviewObservation: {
        candidateStructuralValidator: {
          errorCount: number;
          errorTypes: string[];
          status: string;
        };
        scoredForPromotion: boolean;
        semanticOracleObservation: {
          findingKey: string;
          status: string;
        };
      };
      runtimeWindow: {
        remainingRunsExecuted: number;
        retryExecuted: boolean;
        sourceBearingRunsExecuted: number;
      };
      status: string;
      transferBoundary: {
        externalModelRequests: number;
        privateSourceTransmitted: boolean;
        publicSyntheticSourceTransmitted: boolean;
      };
    };
    const freeze = JSON.parse(
      readText(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-07-offline-freeze.json',
      ),
    ) as {
      expectedTestResultsMatched: string;
      preparedRuns: unknown[];
      repeatAssertions: unknown[];
      runtimeCandidate: { deltaComparedWithCandidate06: string; skillTreeSha256: string };
      sourcePolicy: { externalModelRequests: number; sourceTransmitted: boolean };
      status: string;
    };
    const planDocument = readText(
      'docs/post-v0.4.0-grouped-ledger-candidate-07-evaluation-plan.md',
    );

    expect(plan).toMatchObject({
      status: 'no-go-stage-1-stopped-after-run-01-execution-and-structure-failure',
      runtimeCandidate: {
        deltaComparedWithCandidate06: 'byte-identical',
        skillBehaviorChanged: false,
        validatorBehaviorChanged: false,
        clientContractChanged: false,
      },
      offlineFreeze: {
        status: 'pass-source-free-probe-not-authorized',
        preparedWorkspaces: '7/7',
        expectedTestResultsMatched: '7/7',
        repeatPairsByteIdentical: '2/2',
        sourceTransmitted: false,
      },
      lateLoginObservation: {
        userReportedBrowserLoginComplete: true,
        recordedAsCandidate06RuntimeEvidence: false,
        recordedAsCandidate07RuntimeEvidence: false,
      },
      sourceFreeProbe: {
        status: 'pass-historical-precondition-superseded-by-candidate-no-go',
        freshIsolatedHomeRequired: true,
        decodedResponse: 'CLIENT_ISOLATION_OK',
        assistantMessages: 1,
        toolCalls: 0,
        mcpCalls: 0,
        sourceFreeProbeExecuted: true,
        externalModelRequests: 1,
        sourceTransmitted: false,
      },
      prospectiveRuntimeWindow: {
        status: 'closed-no-go-after-stage-1-run-01',
        stage1: {
          runsExecuted: ['D-ID-001 RUN-01'],
          runsStopped: ['Q-ID-001 RUN-01', 'Q-ID-001 RUN-02'],
        },
        stage2: { runsExecuted: [], status: 'not-authorized' },
      },
      sourcePolicy: {
        sourceBearingAuthorized: false,
        sourceBearingAttemptExecuted: true,
        externalModelRequests: 2,
        publicSyntheticSourceTransmitted: true,
        privateSourceTransmitted: false,
        sourceTransmitted: true,
      },
      stage1Attempt: {
        status: 'no-go-stage-1-stopped-after-run-01-execution-and-structure-failure',
        shellPermissionDenied: 1,
        declaredFixtureTestCallsExpected: 1,
        declaredFixtureTestCallsObserved: 0,
        structuralErrorCount: 16,
        structuralErrorTypes: [
          'coverage-ledger-missing-before-after',
          'coverage-ledger-missing-disposition',
        ],
        semanticOracleObservation: 'pass-unscored-observation',
        promotionScored: false,
      },
      postStopClosure: {
        status: 'pass',
        vitestFiles: '18/18',
        vitestTests: '154/154',
        preparedWorkspaceTrees: '7/7 unchanged',
        runtimeWindowExternalModelRequests: 2,
        runtimeWindowPrivateSourceTransmitted: false,
      },
    });
    expect(freeze).toMatchObject({
      status: 'offline-freeze-complete-source-free-probe-not-authorized',
      expectedTestResultsMatched: '7/7',
      runtimeCandidate: {
        deltaComparedWithCandidate06: 'byte-identical',
        skillTreeSha256:
          '49fd77c07ccb214b4fe464b5019888ac496ca59fd52ba3c04cf8390e8627211d',
      },
      sourcePolicy: { externalModelRequests: 0, sourceTransmitted: false },
    });
    expect(freeze.preparedRuns).toHaveLength(7);
    expect(freeze.repeatAssertions).toHaveLength(2);
    expect(probeResult).toMatchObject({
      status: 'pass-source-free-precondition-source-bearing-authorization-pending',
      login: { status: 'pass', processExitCode: 0, retryExecuted: false },
      probe: {
        status: 'pass',
        processExitCode: 0,
        decodedResponse: 'CLIENT_ISOLATION_OK',
        toolCalls: 0,
        mcpCalls: 0,
        sourceTransmitted: false,
      },
      integrity: {
        preparedWorkspaceTreesUnchanged: '7/7',
        sourceFreeWorkspaceUnchanged: true,
      },
    });
    expect(stage1Result).toMatchObject({
      status: 'no-go-stage-1-stopped-after-run-01-execution-and-structure-failure',
      clientContract: {
        status: 'fail-trace-permission-denied',
        shellPermissionDenied: 1,
        retried: false,
      },
      transferBoundary: {
        externalModelRequests: 1,
        publicSyntheticSourceTransmitted: true,
        privateSourceTransmitted: false,
      },
      executionAudit: {
        declaredFixtureTestCallsExpected: 1,
        declaredFixtureTestCallsObserved: 0,
        workspaceStatusUnchanged: true,
        preparedWorkspaceTreesUnchanged: '7/7',
      },
      reviewObservation: {
        scoredForPromotion: false,
        semanticOracleObservation: {
          status: 'pass-unscored-observation',
          findingKey: 'stale-profile-token-after-logout',
        },
        candidateStructuralValidator: {
          status: 'fail',
          errorCount: 16,
          errorTypes: [
            'coverage-ledger-missing-before-after',
            'coverage-ledger-missing-disposition',
          ],
        },
      },
      runtimeWindow: {
        sourceBearingRunsExecuted: 1,
        remainingRunsExecuted: 0,
        retryExecuted: false,
      },
    });
    expect(plan.sourceFreeProbe.resultSha256).toBe(
      crypto
        .createHash('sha256')
        .update(
          readText(
            'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-07-probe-result.json',
          ),
        )
        .digest('hex'),
    );
    expect(plan.stage1Attempt.resultSha256).toBe(
      crypto
        .createHash('sha256')
        .update(
          readText(
            'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-07-stage-1-result.json',
          ),
        )
        .digest('hex'),
    );
    expect(planDocument).toContain('Candidate 07 is a new runtime window');
    expect(planDocument).toContain('cannot replace the missing client trace');
    expect(planDocument).toContain('The probe passed: process exit `0`');
    expect(planDocument).toContain('Candidate 07 is closed `No-Go`');
    expect(planDocument).toContain('Correct semantics do not override the execution or structural failures');
    expect(planDocument).toContain('Post-stop closure passes `18 / 18` Vitest files');
    expect(
      exists(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-07-probe-result.json',
      ),
    ).toBe(true);
    expect(
      exists(
        'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-07-stage-1-result.json',
      ),
    ).toBe(true);
    expect(exists('scripts/prepare-grouped-ledger-candidate-07.mjs')).toBe(true);
    expect(exists('tests/grouped-candidate-07-preparer.test.ts')).toBe(true);
  });

  test('freezes Candidate 08 behind static closure and a separate Plan-mode capability gate', () => {
    const planPath =
      'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-08-plan.json';
    const freezePath =
      'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-08-offline-freeze.json';
    const plan = JSON.parse(readText(planPath)) as {
      applicationBoundary: {
        installedSkillChanged: boolean;
        publicSkillChanged: boolean;
        releaseChanged: boolean;
      };
      candidate: string;
      candidateDelta: {
        client: { candidate08Mode: string; forbiddenFlags: string[] };
        skill: {
          newVisibleOutputFields: number;
          skillSha256: string;
          validatorBehaviorChanged: boolean;
        };
        testEvidence: { cursorExecutionsExpected: number; rawTestOutputTransmitted: boolean };
      };
      offlineFreeze: { resultSha256: string };
      postStopClosure: {
        externalModelRequests: number;
        jsonDocuments: string;
        markdownLocalLinks: string;
        retryExecuted: boolean;
        sourceBearingRunsExecuted: number;
        sourceFreeWorkspaceUnchanged: boolean;
        sourceTransmitted: boolean;
        status: string;
        vitest: string;
      };
      sourceFreeCapabilityProbe: {
        authorized: boolean;
        externalModelRequestsExecuted: number;
        finalAssistantResponseExact: boolean;
        requestedSandboxPolicy: string;
        resultEventResponseExact: boolean;
        resultSha256: string;
        sourceBearingAllowed: boolean;
        status: string;
        strictReadOnlyEnforcementProven: boolean;
      };
      sourcePolicy: {
        externalModelRequests: number;
        sourceBearingAuthorized: boolean;
        sourceFreeProbeAuthorized: boolean;
        sourceTransmitted: boolean;
      };
      staticValidation: {
        candidateNodeSyntax: string;
        candidateSkillValidators: string;
        frozenWorkspaceHashesUnchanged: string;
        gitDiffCheck: string;
        groupedLedgerReplay: string;
        jsonDocuments: string;
        markdownLocalLinks: string;
        sensitiveIdentifiers: number;
        status: string;
        vitest: string;
      };
      status: string;
    };
    const probeResultPath =
      'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-08-probe-result.json';
    const probeResult = JSON.parse(readText(probeResultPath)) as {
      authorization: {
        sourceBearingAuthorized: boolean;
        sourceFreeExternalRequestsExecuted: number;
      };
      integrity: {
        preparedWorkspaceTreesUnchanged: string;
        sourceFreeWorkspaceUnchanged: boolean;
      };
      probe: {
        finalAssistantResponseExact: boolean;
        mcpCalls: number;
        requestedSandboxPolicy: string;
        resultEventResponseExact: boolean;
        strictReadOnlyEnforcementProven: boolean;
        toolCallsStarted: number;
        workspaceMutationObserved: boolean;
      };
      runtimeWindow: { retryExecuted: boolean; sourceBearingRunsExecuted: number };
      status: string;
    };
    const freeze = JSON.parse(readText(freezePath)) as {
      clientContract: { forbiddenFlags: string[]; mode: string; permissionFallbackAllowed: boolean };
      preparedRuns: Array<{ expectedCursorTestCalls: number }>;
      repeatAssertions: unknown[];
      sourcePolicy: {
        externalModelRequests: number;
        sourceBearingAuthorized: boolean;
        sourceFreeProbeAuthorized: boolean;
        sourceTransmitted: boolean;
      };
      status: string;
      testEvidenceContract: { expectedResultsMatched: string };
    };
    const planDocument = readText(
      'docs/post-v0.4.0-grouped-ledger-candidate-08-evaluation-plan.md',
    );

    expect(plan).toMatchObject({
      candidate: 'post-v0.4.0-grouped-ledger-candidate-08',
      status:
        'no-go-source-free-plan-capability-probe-output-and-read-only-contract-failure',
      candidateDelta: {
        client: {
          candidate08Mode: 'plan',
          forbiddenFlags: ['--auto-review', '--force', '--yolo', '--approve-mcps'],
        },
        skill: {
          newVisibleOutputFields: 0,
          skillSha256:
            '7c48a782f0580ce44d754bd2de11ab6195af47cce16752f1b0251971b632cf35',
          validatorBehaviorChanged: false,
        },
        testEvidence: { cursorExecutionsExpected: 0, rawTestOutputTransmitted: false },
      },
      staticValidation: {
        candidateNodeSyntax: '3/3',
        candidateSkillValidators: '2/2',
        frozenWorkspaceHashesUnchanged: '7/7',
        gitDiffCheck: 'pass',
        groupedLedgerReplay: '7/7',
        jsonDocuments: '134/134',
        markdownLocalLinks: '166/166 across 58 files',
        sensitiveIdentifiers: 0,
        status: 'pass',
        vitest: '21/21 files and 160/160 tests',
      },
      sourceFreeCapabilityProbe: {
        status: 'fail-output-and-read-only-contract',
        authorized: true,
        externalModelRequestsExecuted: 1,
        finalAssistantResponseExact: true,
        resultEventResponseExact: false,
        requestedSandboxPolicy: 'TYPE_WORKSPACE_READWRITE',
        strictReadOnlyEnforcementProven: false,
        sourceBearingAllowed: false,
      },
      sourcePolicy: {
        externalModelRequests: 1,
        sourceBearingAuthorized: false,
        sourceFreeProbeAuthorized: true,
        sourceTransmitted: false,
      },
      applicationBoundary: {
        installedSkillChanged: false,
        publicSkillChanged: false,
        releaseChanged: false,
      },
      postStopClosure: {
        status: 'pass',
        vitest: '21/21 files and 160/160 tests',
        jsonDocuments: '135/135',
        markdownLocalLinks: '167/167 across 58 files',
        sourceFreeWorkspaceUnchanged: true,
        sourceBearingRunsExecuted: 0,
        externalModelRequests: 1,
        sourceTransmitted: false,
        retryExecuted: false,
      },
    });
    expect(freeze).toMatchObject({
      status: 'offline-freeze-complete-source-free-plan-capability-probe-not-authorized',
      clientContract: {
        mode: 'plan',
        forbiddenFlags: ['--auto-review', '--force', '--yolo', '--approve-mcps'],
        permissionFallbackAllowed: false,
      },
      sourcePolicy: {
        externalModelRequests: 0,
        sourceBearingAuthorized: false,
        sourceFreeProbeAuthorized: false,
        sourceTransmitted: false,
      },
      testEvidenceContract: { expectedResultsMatched: '7/7' },
    });
    expect(freeze.preparedRuns).toHaveLength(7);
    expect(freeze.preparedRuns.every((run) => run.expectedCursorTestCalls === 0)).toBe(true);
    expect(freeze.repeatAssertions).toHaveLength(2);
    expect(plan.offlineFreeze.resultSha256).toBe(
      crypto.createHash('sha256').update(readText(freezePath)).digest('hex'),
    );
    expect(plan.sourceFreeCapabilityProbe.resultSha256).toBe(
      crypto.createHash('sha256').update(readText(probeResultPath)).digest('hex'),
    );
    expect(probeResult).toMatchObject({
      status: 'no-go-source-free-plan-capability-probe-output-and-read-only-contract-failure',
      authorization: {
        sourceFreeExternalRequestsExecuted: 1,
        sourceBearingAuthorized: false,
      },
      probe: {
        finalAssistantResponseExact: true,
        resultEventResponseExact: false,
        toolCallsStarted: 1,
        mcpCalls: 0,
        requestedSandboxPolicy: 'TYPE_WORKSPACE_READWRITE',
        strictReadOnlyEnforcementProven: false,
        workspaceMutationObserved: false,
      },
      integrity: {
        preparedWorkspaceTreesUnchanged: '7/7',
        sourceFreeWorkspaceUnchanged: true,
      },
      runtimeWindow: { retryExecuted: false, sourceBearingRunsExecuted: 0 },
    });
    expect(planDocument).toContain(
      'Status: Candidate 08 `No-Go`; source-free Plan-mode probe failed output and strict read-only contracts',
    );
    expect(planDocument).toContain('Static closure passes `21 / 21` Vitest files');
    expect(planDocument).toContain('The gate still failed for two independent reasons');
    expect(planDocument).toContain('Candidate 08 is closed `No-Go`');
    expect(planDocument).toContain('Post-stop closure passes `21 / 21` Vitest files');
    expect(exists('scripts/build-grouped-ledger-candidate-08.mjs')).toBe(true);
    expect(exists('scripts/run-cursor-evaluation-v4.mjs')).toBe(true);
    expect(exists('scripts/prepare-grouped-ledger-candidate-08.mjs')).toBe(true);
    expect(exists('tests/grouped-candidate-08-builder.test.ts')).toBe(true);
    expect(exists('tests/cursor-evaluation-runner-v4.test.ts')).toBe(true);
    expect(exists('tests/grouped-candidate-08-preparer.test.ts')).toBe(true);
  });

  test('keeps Candidate 09 tooling-only behind OS-enforced read-only isolation', () => {
    const planPath =
      'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-09-plan.json';
    const proofPath =
      'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-09-local-proof.json';
    const resultPath =
      'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-09-probe-result.json';
    const plan = JSON.parse(readText(planPath)) as {
      applicationBoundary: {
        candidate09ExternalRequestExecuted: boolean;
        candidate09LoginCreated: boolean;
        installedSkillChanged: boolean;
        publicSkillChanged: boolean;
      };
      candidateDelta: {
        classification: string;
        probeAuditor: { resultMustMatchOrderedAssistantAggregate: boolean; sha256: string };
        runner: { outerSandbox: string; sha256: string };
        seatbeltProfile: { protectedRootWriteDenied: boolean; sha256: string };
        skill: { deltaComparedWithCandidate08: string; skillTreeSha256: string };
      };
      localProof: { resultSha256: string; status: string };
      platformBoundary: {
        crossPlatformRuntimeClaimed: boolean;
        evaluationHost: string;
        seatbeltIsSkillRuntimeDependency: boolean;
      };
      postStopValidation: {
        fullVitest: string;
        jsonDocuments: string;
        markdownLocalLinks: string;
        status: string;
      };
      prospectiveSourceFreeProbe: {
        authorized: boolean;
        candidate08HomeReuseAllowed: boolean;
        outerSeatbeltRequired: boolean;
        sourceBearingAllowed: boolean;
      };
      sourceFreeProbeResult: {
        commandExitCode: number;
        externalModelRequests: number;
        resultSha256: string;
        reviewedSourceTransmitted: boolean;
        status: string;
        workspaceUnchanged: boolean;
      };
      sourcePolicy: { externalModelRequests: number; sourceTransmitted: boolean };
      staticValidation: {
        fullVitest: string;
        jsonDocuments: string;
        markdownLocalLinks: string;
        status: string;
        targetedVitest: string;
      };
      status: string;
    };
    const proof = JSON.parse(readText(proofPath)) as {
      applicationBoundary: {
        candidate09ExternalRequestExecuted: boolean;
        candidate09LoginCreated: boolean;
      };
      runnerIntegrationProof: {
        externalModelRequests: number;
        publicFileRead: boolean;
        sourceTransmitted: boolean;
        workspaceWriteAttemptBlocked: boolean;
      };
      seatbeltDirectProof: {
        createProtectedRootFile: string;
        createWorkspaceFile: string;
        modifyWorkspaceFile: string;
        readExistingWorkspaceFile: string;
      };
      status: string;
      transportReplay: {
        candidate08ResultReinterpreted: boolean;
        candidate09ProbeAuditorValid: boolean;
      };
    };
    const result = JSON.parse(readText(resultPath)) as {
      authorization: {
        sourceBearingAuthorized: boolean;
        sourceFreeExternalRequestsExecuted: number;
      };
      probe: {
        commandExact: boolean;
        commandExitCode: number;
        finalAssistantResponseExact: boolean;
        mcpCalls: number;
        planModeReadOnlyCommandCapabilityProven: boolean;
        resultEventMatchesOrderedAssistantAggregate: boolean;
        workspaceMutationObserved: boolean;
      };
      runtimeWindow: {
        retryExecuted: boolean;
        sourceBearingRunsExecuted: number;
      };
      status: string;
    };
    const planDocument = readText(
      'docs/post-v0.4.0-grouped-ledger-candidate-09-evaluation-plan.md',
    );

    expect(plan).toMatchObject({
      status:
        'complete-no-go-source-free-plan-capability-probe-nested-sandbox-failure',
      candidateDelta: {
        classification: 'evaluation-tooling-only',
        skill: {
          deltaComparedWithCandidate08: 'byte-identical',
          skillTreeSha256:
            'd25f55a5e11dd59c2eb8f16f3d4650924e61d1bee05c6b19b6545c83b61ef18f',
        },
        runner: {
          outerSandbox: '/usr/bin/sandbox-exec',
          sha256: 'c3b6d558c98365f887c1a1917253e0c610a1e663f53ed769ee226caf149bc549',
        },
        seatbeltProfile: {
          protectedRootWriteDenied: true,
          sha256: '6ed882cbbd2605d3192502484407641d48dd15a1bc0e1b77f0682844d092ed40',
        },
        probeAuditor: {
          resultMustMatchOrderedAssistantAggregate: true,
          sha256: '240aa0ba782f6acd0b273490435c09310c533be4e3b4ec4e667a42eb39705967',
        },
      },
      localProof: { status: 'pass' },
      platformBoundary: {
        evaluationHost: 'macOS only',
        seatbeltIsSkillRuntimeDependency: false,
        crossPlatformRuntimeClaimed: false,
      },
      staticValidation: {
        status: 'pass',
        targetedVitest: '3/3 files and 28/28 tests',
        fullVitest: '23/23 files and 169/169 tests',
        jsonDocuments: '137/137',
        markdownLocalLinks: '168/168 across 59 files',
      },
      prospectiveSourceFreeProbe: {
        authorized: true,
        candidate08HomeReuseAllowed: false,
        outerSeatbeltRequired: true,
        sourceBearingAllowed: false,
      },
      sourceFreeProbeResult: {
        status: 'no-go',
        externalModelRequests: 1,
        commandExitCode: 71,
        workspaceUnchanged: true,
        reviewedSourceTransmitted: false,
      },
      postStopValidation: {
        status: 'pass',
        fullVitest: '23/23 files and 169/169 tests',
        jsonDocuments: '138/138',
        markdownLocalLinks: '169/169 across 59 files',
      },
      sourcePolicy: { externalModelRequests: 1, sourceTransmitted: false },
      applicationBoundary: {
        candidate09ExternalRequestExecuted: true,
        candidate09LoginCreated: true,
        installedSkillChanged: false,
        publicSkillChanged: false,
      },
    });
    expect(proof).toMatchObject({
      status: 'pass-local-seatbelt-and-transport-tooling-proof',
      seatbeltDirectProof: {
        readExistingWorkspaceFile: 'pass',
        createWorkspaceFile: 'blocked-operation-not-permitted',
        modifyWorkspaceFile: 'blocked-operation-not-permitted',
        createProtectedRootFile: 'blocked-operation-not-permitted',
      },
      runnerIntegrationProof: {
        publicFileRead: true,
        workspaceWriteAttemptBlocked: true,
        externalModelRequests: 0,
        sourceTransmitted: false,
      },
      transportReplay: {
        candidate08ResultReinterpreted: false,
        candidate09ProbeAuditorValid: true,
      },
      applicationBoundary: {
        candidate09ExternalRequestExecuted: false,
        candidate09LoginCreated: false,
      },
    });
    expect(plan.localProof.resultSha256).toBe(
      crypto.createHash('sha256').update(readText(proofPath)).digest('hex'),
    );
    expect(plan.sourceFreeProbeResult.resultSha256).toBe(
      crypto.createHash('sha256').update(readText(resultPath)).digest('hex'),
    );
    expect(result).toMatchObject({
      status: 'no-go-source-free-plan-capability-probe-nested-sandbox-failure',
      authorization: {
        sourceFreeExternalRequestsExecuted: 1,
        sourceBearingAuthorized: false,
      },
      probe: {
        commandExact: true,
        commandExitCode: 71,
        finalAssistantResponseExact: true,
        resultEventMatchesOrderedAssistantAggregate: true,
        mcpCalls: 0,
        planModeReadOnlyCommandCapabilityProven: false,
        workspaceMutationObserved: false,
      },
      runtimeWindow: { retryExecuted: false, sourceBearingRunsExecuted: 0 },
    });
    expect(planDocument).toContain('Candidate 09 is an evaluation-tooling-only successor');
    expect(planDocument).toContain('result event is an ordered aggregation');
    expect(planDocument).toContain('denies `file-write*`');
    expect(planDocument).toContain('not a runtime dependency of `fe-code-review`');
    expect(planDocument).toContain('no Candidate 09 login');
    expect(planDocument).toContain('Static closure passes `23 / 23` Vitest files');
    expect(planDocument).toContain('The capability gate still failed');
    expect(planDocument).toContain('Candidate 09 is closed `No-Go`');
    expect(planDocument).toContain('Post-stop closure passes `23 / 23` Vitest files');
    expect(exists('evaluation/profiles/cursor-workspace-read-only.sb')).toBe(true);
    expect(exists('scripts/run-cursor-evaluation-v5.mjs')).toBe(true);
    expect(exists('scripts/audit-cursor-plan-probe.mjs')).toBe(true);
    expect(exists('tests/cursor-evaluation-runner-v5.test.ts')).toBe(true);
    expect(exists('tests/cursor-plan-probe-audit.test.ts')).toBe(true);
  });

  test('keeps Candidate 10 as a new outer-Seatbelt-only evaluation window', () => {
    const planPath =
      'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-10-plan.json';
    const proofPath =
      'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-10-local-proof.json';
    const resultPath =
      'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-10-probe-result.json';
    const plan = JSON.parse(readText(planPath)) as {
      authorization: {
        isolatedLoginAuthorized: boolean;
        sourceFreeExternalRequestAuthorized: boolean;
        sourceBearingAuthorized: boolean;
      };
      frozenDelta: {
        classification: string;
        probeAuditor: { failureShapeMustReportActualCommandAndExit: boolean; sha256: string };
        runner: {
          clientArgumentDelta: { from: string[]; to: string[] };
          outerSandboxRequired: string;
          sha256: string;
        };
        seatbeltProfile: { changed: boolean };
        skill: { deltaComparedWithCandidate09: string };
      };
      localProof: { externalModelRequests: number; resultSha256: string; status: string };
      prospectiveSourceFreeProbe: {
        candidate09HomeReuseAllowed: boolean;
        clientSandbox: string;
        externalModelRequestsExecuted: number;
        outerSeatbeltRequired: boolean;
      };
      postStopValidation: {
        fullVitest: string;
        jsonDocuments: string;
        markdownLocalLinks: string;
        status: string;
      };
      staticValidation: {
        fullVitest: string;
        jsonDocuments: string;
        markdownLocalLinks: string;
        status: string;
        targetedVitest: string;
      };
      sourceFreeProbeResult: {
        commandExecutions: number;
        commandRejected: boolean;
        externalModelRequests: number;
        resultSha256: string;
        status: string;
        workspaceUnchanged: boolean;
      };
      status: string;
    };
    const proof = JSON.parse(readText(proofPath)) as {
      codexSandboxAttempt: {
        classification: string;
        cursorExecuted: boolean;
        externalModelRequests: number;
      };
      hostLevelSeatbeltProof: {
        cursorExecuted: boolean;
        externalModelRequests: number;
        gitStatusExitCode: number;
        protectedRootMarkerCreated: boolean;
        status: string;
        workspaceMarkerCreated: boolean;
        workspaceTreeUnchanged: boolean;
      };
      status: string;
    };
    const result = JSON.parse(readText(resultPath)) as {
      authorization: {
        sourceBearingAuthorized: boolean;
        sourceFreeExternalRequestsExecuted: number;
      };
      probe: {
        commandExact: boolean;
        commandExecutions: number;
        commandRejected: boolean;
        finalAssistantResponseExact: boolean;
        mcpCalls: number;
        planModeReadOnlyCommandCapabilityProven: boolean;
        resultEventMatchesOrderedAssistantAggregate: boolean;
        workspaceMutationObserved: boolean;
      };
      runtimeWindow: { retryExecuted: boolean; sourceBearingRunsExecuted: number };
      status: string;
    };
    const planDocument = readText(
      'docs/post-v0.4.0-grouped-ledger-candidate-10-evaluation-plan.md',
    );

    expect(plan).toMatchObject({
      status:
        'complete-no-go-source-free-plan-capability-probe-command-rejected',
      frozenDelta: {
        classification: 'evaluation-tooling-only',
        skill: { deltaComparedWithCandidate09: 'byte-identical' },
        runner: {
          clientArgumentDelta: {
            from: ['--sandbox', 'enabled'],
            to: ['--sandbox', 'disabled'],
          },
          outerSandboxRequired: '/usr/bin/sandbox-exec',
          sha256: '6144c30a7495a6e0f4e52ba0d78745ab35bc8af09f93f2d87a9ab7f7ba7abc10',
        },
        probeAuditor: {
          failureShapeMustReportActualCommandAndExit: true,
          sha256: '1c8003ab5bc6c67c25e518595a8878a205d1e3c45d347244a24312468a821c80',
        },
        seatbeltProfile: { changed: false },
      },
      localProof: { status: 'pass', externalModelRequests: 0 },
      authorization: {
        isolatedLoginAuthorized: true,
        sourceFreeExternalRequestAuthorized: true,
        sourceBearingAuthorized: false,
      },
      prospectiveSourceFreeProbe: {
        candidate09HomeReuseAllowed: false,
        clientSandbox: 'disabled',
        outerSeatbeltRequired: true,
        externalModelRequestsExecuted: 1,
      },
      staticValidation: {
        status: 'pass',
        targetedVitest: '3/3 files and 30/30 tests',
        fullVitest: '25/25 files and 179/179 tests',
        jsonDocuments: '140/140',
        markdownLocalLinks: '170/170 across 60 files',
      },
      sourceFreeProbeResult: {
        status: 'no-go',
        externalModelRequests: 1,
        commandExecutions: 0,
        commandRejected: true,
        workspaceUnchanged: true,
      },
      postStopValidation: {
        status: 'pass',
        fullVitest: '25/25 files and 179/179 tests',
        jsonDocuments: '141/141',
        markdownLocalLinks: '171/171 across 60 files',
      },
    });
    expect(plan.localProof.resultSha256).toBe(
      crypto.createHash('sha256').update(readText(proofPath)).digest('hex'),
    );
    expect(plan.sourceFreeProbeResult.resultSha256).toBe(
      crypto.createHash('sha256').update(readText(resultPath)).digest('hex'),
    );
    expect(proof).toMatchObject({
      status: 'pass-host-level-seatbelt-and-offline-tooling-proof',
      codexSandboxAttempt: {
        classification: 'invalid-host-context-preflight',
        cursorExecuted: false,
        externalModelRequests: 0,
      },
      hostLevelSeatbeltProof: {
        status: 'pass',
        gitStatusExitCode: 0,
        workspaceMarkerCreated: false,
        protectedRootMarkerCreated: false,
        workspaceTreeUnchanged: true,
        cursorExecuted: false,
        externalModelRequests: 0,
      },
    });
    expect(result).toMatchObject({
      status: 'no-go-source-free-plan-capability-probe-command-rejected',
      authorization: {
        sourceFreeExternalRequestsExecuted: 1,
        sourceBearingAuthorized: false,
      },
      probe: {
        commandExact: true,
        commandExecutions: 0,
        commandRejected: true,
        finalAssistantResponseExact: true,
        resultEventMatchesOrderedAssistantAggregate: true,
        mcpCalls: 0,
        planModeReadOnlyCommandCapabilityProven: false,
        workspaceMutationObserved: false,
      },
      runtimeWindow: { retryExecuted: false, sourceBearingRunsExecuted: 0 },
    });
    expect(planDocument).toContain('Candidate 10 is a new evaluation-tooling-only window');
    expect(planDocument).toContain('The only client-argument change is');
    expect(planDocument).toContain('invalid host-context preflight is retained');
    expect(planDocument).toContain('zero external model requests');
    expect(planDocument).toContain('Static closure passes `25 / 25` Vitest files');
    expect(planDocument).toContain('The capability gate still failed');
    expect(planDocument).toContain('Candidate 10 is closed `No-Go`');
    expect(planDocument).toContain('Post-stop closure passes `25 / 25` Vitest files');
    expect(exists('scripts/run-cursor-evaluation-v6.mjs')).toBe(true);
    expect(exists('scripts/audit-cursor-plan-probe-v2.mjs')).toBe(true);
    expect(exists('tests/cursor-evaluation-runner-v6.test.ts')).toBe(true);
    expect(exists('tests/cursor-plan-probe-audit-v2.test.ts')).toBe(true);
  });

  test('records Candidate 11 source-free capability and first source-bearing No-Go', () => {
    const planPath =
      'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-11-plan.json';
    const resultPath =
      'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-11-probe-result.json';
    const stageResultPath =
      'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-11-stage-1-result.json';
    const freezePath =
      'evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-11-offline-freeze.json';
    const plan = JSON.parse(readText(planPath)) as {
      authorization: {
        isolatedLoginAuthorized: boolean;
        sourceBearingAuthorized: boolean;
        sourceFreeExternalRequestAuthorized: boolean;
      };
      offlineClosure: { fullVitest: string; jsonDocuments: string; nodeSyntax: string; status: string };
      offlineFreeze: {
        result: string;
        resultSha256: string;
        workspaces: string;
        nonDeepEvaluatorCollectors: string;
        deepEvaluatorInventories: string;
        repeatAssertions: string;
        sourceBearingAuthorized: boolean;
      };
      sourceBearingWindow: {
        status: string;
        resultSha256: string;
        executedRuns: string;
        remainingRunsExecuted: number;
        outputValidator: string;
        sourceTransmitted: boolean;
      };
      prospectiveSourceFreeProbe: {
        externalModelRequestsExecuted: number;
        readToolCallsStarted: number;
        shellCalls: number;
        status: string;
      };
      status: string;
    };
    const result = JSON.parse(readText(resultPath)) as {
      authorization: {
        privateSourceAllowed: boolean;
        sourceBearingAuthorized: boolean;
        sourceFreeExternalRequestsExecuted: number;
      };
      probe: {
        finalAssistantResponseExact: boolean;
        mcpCalls: number;
        otherToolCalls: number;
        readToolCallsStarted: number;
        readToolCallsCompleted: number;
        shellCalls: number;
        workspaceMutationObserved: boolean;
      };
      probeAudit: { valid: boolean; violations: string[] };
      status: string;
    };
    const planDocument = readText(
      'docs/post-v0.4.0-grouped-ledger-candidate-11-evaluation-plan.md',
    );

    expect(plan).toMatchObject({
      status: 'no-go-stopped-after-first-source-bearing-run',
      authorization: {
        isolatedLoginAuthorized: true,
        sourceFreeExternalRequestAuthorized: true,
        sourceBearingAuthorized: true,
      },
      offlineClosure: {
        status: 'pass',
        fullVitest: '27/27 files and 188/188 tests',
        jsonDocuments: '144/144',
        nodeSyntax: '23/23',
      },
      offlineFreeze: {
        result: freezePath,
        resultSha256: '54164bdc7ac0a9855ac47cfa44275482df37428b37b8f1a1ca45217582e790e8',
        workspaces: '7/7',
        nonDeepEvaluatorCollectors: '6/6',
        deepEvaluatorInventories: '1/1',
        repeatAssertions: '2/2',
        sourceBearingAuthorized: false,
      },
      sourceBearingWindow: {
        status: 'no-go-stopped-after-first-source-bearing-run',
        resultSha256: '1d3a423a9574b5326be5983ad7840dc0d5c55d099bddbb0baf107058dd1d7eea',
        executedRuns: '1/7',
        remainingRunsExecuted: 0,
        outputValidator: 'failed: grouped ledger coverage entries missing before/after and disposition fields',
        sourceTransmitted: true,
      },
      prospectiveSourceFreeProbe: {
        status: 'pass',
        externalModelRequestsExecuted: 1,
        readToolCallsStarted: 1,
        shellCalls: 0,
      },
    });
    expect(result).toMatchObject({
      status: 'pass-source-free-read-capability-source-bearing-unauthorized',
      authorization: {
        sourceFreeExternalRequestsExecuted: 1,
        sourceBearingAuthorized: false,
        privateSourceAllowed: false,
      },
      probe: {
        finalAssistantResponseExact: true,
        readToolCallsStarted: 1,
        readToolCallsCompleted: 1,
        shellCalls: 0,
        mcpCalls: 0,
        otherToolCalls: 0,
        workspaceMutationObserved: false,
      },
      probeAudit: { valid: true, violations: [] },
    });
    const freeze = JSON.parse(readText(freezePath)) as {
      candidate: string;
      runs: Array<{ caseId: string; mode: string; runId: string; promptSha256: string }>;
      repeatAssertions: Array<{ caseId: string }>;
      externalModelRequests: number;
      sourceTransmitted: boolean;
      sourceBearingAuthorized: boolean;
    };
    expect(freeze).toMatchObject({
      candidate: 'post-v0.4.0-grouped-ledger-candidate-11',
      externalModelRequests: 0,
      sourceTransmitted: false,
      sourceBearingAuthorized: false,
    });
    expect(freeze.runs).toHaveLength(7);
    expect(freeze.repeatAssertions).toHaveLength(2);
    expect(planDocument).toContain('The probe passed: process exit `0`');
    expect(planDocument).toContain('Candidate 11 is closed `No-Go`');
    expect(planDocument).toContain(
      'The temporary HOME and raw trace remain outside the repository',
    );
    expect(exists(resultPath)).toBe(true);
    expect(exists(stageResultPath)).toBe(true);
  });

  test('installs an explicit temporary Skill source before the fixture baseline commit', () => {
    const skillSource = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-code-review-custom-skill-'));
    temporaryDirectories.push(skillSource);
    fs.cpSync(path.join(rootDir, 'skills', 'fe-code-review'), skillSource, {
      filter: (source) => path.basename(source) !== '.plugin-eval',
      recursive: true,
    });
    fs.appendFileSync(path.join(skillSource, 'SKILL.md'), '\nCandidate fixture marker.\n');

    const fixture = prepareWithSkillSource('quick-identity', skillSource);
    const agentSkill = path.join(
      fixture.targetDir,
      '.agents',
      'skills',
      'fe-code-review',
      'SKILL.md',
    );
    const cursorSkill = path.join(
      fixture.targetDir,
      '.cursor',
      'skills',
      'fe-code-review',
      'SKILL.md',
    );

    expect(fixture.skillSource).toBe(fs.realpathSync(skillSource));
    expect(fs.readFileSync(agentSkill, 'utf8')).toContain('Candidate fixture marker.');
    expect(fs.readFileSync(cursorSkill, 'utf8')).toBe(fs.readFileSync(agentSkill, 'utf8'));
    expect(git(fixture.targetDir, ['show', 'HEAD:.agents/skills/fe-code-review/SKILL.md'])).toContain(
      'Candidate fixture marker.',
    );
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

import crypto from 'node:crypto';

import { describe, expect, test } from 'vitest';

import { exists, readText } from './test-utils';

const planPath = 'evaluation/runtime-windows/v0.5.0-codex-runtime-acceptance-plan.json';
const documentPath = 'docs/v0.5.0-codex-runtime-acceptance-plan.md';
const plan = JSON.parse(readText(planPath));
const runs = plan.runs as Array<{
  sequence: number;
  stage: number;
  caseId: string;
  runId: string;
  mode: string;
  fixtureMode: string;
  oracle: string;
  scope: string;
  contextCollectorCalls: number;
  expectedTestExitCode: number;
}>;

describe('v0.5.0 Codex runtime acceptance design', () => {
  test('does not turn planning or old client evidence into runtime authorization', () => {
    expect(plan.status).toBe('design-ready-runtime-preparation-pending');
    expect(plan.authorization).toEqual({
      offlinePlanOnly: true,
      workspacePreparation: false,
      syntheticGitCommits: false,
      authenticationSetup: false,
      sourceFreeProbe: false,
      stage1SourceBearing: false,
      stage2SourceBearing: false,
    });
    expect(plan.execution).toEqual({
      preparedWorkspaces: [],
      externalModelInvocations: 0,
      sourceTransmitted: false,
      credentialContentsReadOrRecorded: false,
      results: [],
    });
    expect(plan.clientStatus).toEqual({
      codexV050: 'Cannot Verify',
      cursor: 'existing-scoped-acceptance-unchanged',
      claudeCode: 'Cannot Verify',
    });
  });

  test('pins the released Skill separately from maintained evaluator tooling', () => {
    expect(plan.baseline).toMatchObject({
      release: 'v0.5.0',
      releaseCommit: '0b236c45d0f469f784f1ea77b1a94e79de5e8059',
      skillFileCount: 12,
      skillTreeSha256: '148cf6ebae8c5cba674f5fe0fe9f1399f405287b5057d815867662faa1721480',
      skillCopyExcludedDirectories: ['.plugin-eval'],
      toolingCommit: 'ada89b47a226a234cd90b6a6d83e8e5dde228790',
    });
    const hashes = plan.baseline.toolingHashes as Record<string, string>;
    expect(Object.keys(hashes)).toEqual([
      'scripts/prepare-evaluation-fixture.mjs',
      'scripts/audit-runtime-trace.mjs',
      'scripts/validate-review-output.mjs',
      'scripts/validate-review-output-strict.mjs',
      'adapters/cursor/rules/fe-code-review.mdc',
    ]);
    for (const [file, digest] of Object.entries(hashes)) {
      expect(exists(file)).toBe(true);
      expect(digest).toMatch(/^[a-f0-9]{64}$/u);
    }
  });

  test.each(Object.entries(plan.baseline.oracleHashes as Record<string, string>))(
    'retains the original oracle or previous report: %s',
    (file, digest) => {
      expect(crypto.createHash('sha256').update(readText(file)).digest('hex')).toBe(digest);
    },
  );

  test('keeps an exact seven-run order and fresh comparable repeat pairs', () => {
    expect(runs.map(({ sequence, stage, caseId, runId }) =>
      [sequence, stage, caseId, runId])).toEqual([
      [1, 1, 'Q-ID-002', 'RUN-01'],
      [2, 1, 'D-ID-001', 'RUN-01'],
      [3, 2, 'Q-ID-001', 'RUN-01'],
      [4, 2, 'Q-ID-001', 'RUN-02'],
      [5, 2, 'F-ID-001', 'RUN-01'],
      [6, 2, 'F-ID-001', 'RUN-02'],
      [7, 2, 'K-ID-001', 'RUN-01'],
    ]);
    expect(plan.acceptance.repeatCaseIds).toEqual(['Q-ID-001', 'F-ID-001']);
    for (const caseId of plan.acceptance.repeatCaseIds) {
      const pair = runs.filter((run) => run.caseId === caseId);
      expect(pair).toHaveLength(2);
      const comparable = ({ sequence, runId, ...rest }: (typeof runs)[number]) => rest;
      expect(comparable(pair[0])).toEqual(comparable(pair[1]));
    }
    expect(plan.promptPolicy.samePromptBytesForRepeatPairs).toBe(true);
    expect(plan.isolation.separateEphemeralSessionPerRun).toBe(true);
    expect(plan.client.resumeAllowed).toBe(false);
  });

  test('reuses valid fixture modes without collecting outside the selected review scope', () => {
    for (const run of runs) {
      const oracle = JSON.parse(readText(run.oracle)).modes[run.fixtureMode];
      expect(oracle).toBeDefined();
      expect(oracle.prompt).toContain('$fe-code-review');
      expect(run.contextCollectorCalls).toBe(run.mode === 'deep' ? 0 : 1);
      expect(run.expectedTestExitCode).toBe(
        run.mode === 'fix' || run.caseId === 'K-ID-001' ? 0 : 1,
      );
      if (run.mode === 'deep') expect(run.scope).toBe('main...HEAD');
      if (run.mode === 'fix') {
        expect(run.scope).toBe('all-uncommitted-fix-and-direct-regressions');
        expect(oracle.prompt).toContain('.evaluation/previous-findings.md');
      }
    }
    expect(plan.client.entrypoint).toBe('codex exec');
    expect(plan.client.outputFormat).toBe('markdown');
    expect(plan.client.outputSchema).toBeNull();
    expect(plan.promptPolicy.commonSuffix).toContain('已完成的测试断言失败属于审查证据，不等于工具不可用');
  });

  test('retains both severity directions without rewriting or disclosing the oracle', () => {
    const quick = JSON.parse(readText(runs[0].oracle)).modes['quick-independent'];
    const timeoutFinding = quick.expectedFindings.find(
      (finding: { key: string }) => finding.key === 'ignored-timeout-contract',
    );
    expect(timeoutFinding.allowedSeverities).toEqual(['Risk']);
    const deep = JSON.parse(readText(runs[1].oracle)).modes['deep-identity'];
    expect(deep.expectedFindings[0].allowedSeverities).toEqual(['Blocking', 'Risk']);
    expect(plan.semanticOverlay).toMatchObject({
      caseId: 'D-ID-001',
      findingKey: deep.expectedFindings[0].key,
      requiredSeverity: 'Blocking',
      requiredCanonicalOutcome: 'Login/Auth Failure',
      sentToModel: false,
    });
    expect(exists(plan.semanticOverlay.source)).toBe(true);
    expect(plan.promptPolicy.answersOrSeverityOverridesInPrompt).toBe(false);
    expect(plan.promptPolicy.commonSuffix).not.toMatch(/F-\d{3}|Login\/Auth Failure|ignored-timeout|stale-profile/u);
  });

  test('keeps source-free connectivity separate from review quality and source consent', () => {
    expect(plan.sourceFreeProbe).toEqual({
      prompt: 'Return exactly CLIENT_ISOLATION_OK and nothing else. Do not use tools.',
      expectedResponse: 'CLIENT_ISOLATION_OK',
      maximumInvocations: 1,
      expectedToolCalls: 0,
      expectedMcpCalls: 0,
      expectedCompletedTurns: 1,
      expectedFinalMessages: 1,
      expectedExitCode: 0,
      sourceIncluded: false,
      skillIncluded: false,
      provesReviewQuality: false,
      authorizesSourceBearing: false,
    });
    for (const field of [
      'runtimeVersion', 'executableRealpath', 'executableSha256', 'provider', 'endpoint',
      'model', 'reasoningEffort', 'authenticationMethod', 'effectiveConfigSha256',
    ]) expect(plan.client[field]).toBeNull();
    expect(plan.client.requestRetries).toBe(0);
    expect(plan.client.streamRetries).toBe(0);
    expect(plan.client.sourceFreeTimeoutSeconds).toBe(120);
    expect(plan.client.sourceFreeOnlyFlags).toEqual(['--skip-git-repo-check']);
    expect(plan.client.requiredFlags).not.toContain('--skip-git-repo-check');
  });

  test('keeps the Fix single-file exception and credential isolation explicit', () => {
    expect(plan.transferPolicy.forbiddenWorkspacePaths).toContain('.evaluation');
    expect(plan.transferPolicy.fixOnlyReadException).toBe('.evaluation/previous-findings.md');
    expect(plan.promptPolicy.commonSuffix).toContain('Fix Review 唯一例外为 .evaluation/previous-findings.md');
    expect(plan.transferPolicy.forbiddenData).toEqual(expect.arrayContaining([
      'private-project-source', 'personal-config', 'credential-values', 'semantic-oracles',
      'expected-outputs', 'historical-results', 'sibling-workspaces', 'evaluator-code-and-plans',
    ]));
    expect(plan.transferPolicy.privateSourceAllowed).toBe(false);
    expect(plan.isolation).toMatchObject({
      freshHomeAndCodexHome: true,
      copyPersonalConfigOrCredentials: false,
      cleanEnvironmentAllowlist: true,
      oracleAndEvidenceOutsideModelWorkspace: true,
      fixtureTestsRunWithoutAuthSecrets: true,
      fullWorkspaceAndGitStateBeforeAfter: true,
      readOnlySandboxIsNotReadScopeIsolation: true,
      traceAuditIsNotOsSandbox: true,
      automaticReportRepair: false,
    });
    expect(plan.client.promptTransport).toBe('stdin-bytes-with-shell-false');
    expect(plan.promptPolicy.shellInterpolationAllowed).toBe(false);
    expect(plan.client.disabledCapabilities).toEqual([
      'mcp', 'plugins', 'apps', 'hooks', 'memories', 'web-search', 'multi-agent',
    ]);
    expect(plan.preparationGates).toContain('offline-runner-positive-negative-tests-with-no-live-provider');
    expect(plan.preparationGates).toContain('prove-secret-exclusion-from-tool-and-fixture-test-environments-using-nonsecret-canaries');
  });

  test('requires semantic quality, stable closure and complete safety, not just a parser pass', () => {
    expect(plan.acceptance).toMatchObject({
      requiredRuns: 7,
      requiredPasses: 7,
      requiredFindingRecall: 1,
      findingPrecision: 1,
      severityAccuracy: 1,
      fixClosureAccuracy: 1,
      outputContractPassRate: 1,
      readOnlyAndScopePassRate: 1,
      extraFindings: 'independent-source-evidence-adjudication-not-automatic-false-positive',
      zeroDenominatorMetrics: 'N/A-not-100-percent',
      semanticEvaluationRequiredAfterStructuralValidation: true,
      noFindingCaseRequiresZeroActionableFindings: true,
      runtimeBoundaryMustBeStated: true,
      costAndTimeAreObservationOnly: true,
    });
    const fix = JSON.parse(readText(runs[4].oracle)).modes['fix-identity'];
    expect(Object.entries(fix.expectedFindingStatuses).map(([id, value]) => {
      const finding = value as { originalSeverity: string; status: string };
      return [id, finding.originalSeverity, finding.status];
    })).toEqual([
      ['F-001', 'Blocking', 'Resolved'],
      ['F-002', 'Blocking', 'Resolved'],
      ['F-003', 'Risk', 'Resolved'],
    ]);
    expect(fix.expectedNewRegression).toBe('none');
    expect(fix.expectedRecommendation).toBe('可以关闭');
  });

  test('stops on failure without retries, reinterpretation, or output repair', () => {
    expect(plan.stopPolicy).toMatchObject({
      firstFailureStopsRemainingRuns: true,
      retryInPlaceAllowed: false,
      replacementInSameWindowAllowed: false,
      modeOrProviderSwitchAllowed: false,
      changingSkillPromptsOrOraclesMidWindowAllowed: false,
      retainRawFailures: true,
      toolingReplay: 'separately-authorized-offline-replay-retaining-raw-result-no-new-model-request',
      statuses: ['Pass', 'No-Go', 'Cannot Verify', 'Cannot Score', 'Not Run'],
    });
    expect(plan.client.fallbackProviderAllowed).toBe(false);
    expect(plan.client.reviewTimeoutSeconds).toEqual({ quick: 900, deep: 1800, fix: 900 });
    expect(plan.evidencePerRun).toContain('decision-limitations-and-unexecuted-runs');
    expect(plan.evidencePerRun).toContain('output-validator-json-and-semantic-finding-mapping');
  });

  test('links the current queue to a design, not a completed runtime result', () => {
    expect(readText('docs/roadmap.md')).toContain('(v0.5.0-codex-runtime-acceptance-plan.md)');
    const document = readText(documentPath);
    expect(document).toContain(`(../${planPath})`);
    expect(document).toContain('Codex remains `Cannot Verify` for v0.5.0');
    expect(document).toContain('It is not a prepared runtime manifest or an executable runner');
    expect(document).toContain('preparer\'s stdout contains the semantic oracle');
    expect(document).toContain('not evidence of an autonomous edit-and-review loop');
  });
});

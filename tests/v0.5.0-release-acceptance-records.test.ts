import { describe, expect, test } from 'vitest';

import { readText } from './test-utils';

describe('v0.5.0 release acceptance records', () => {
  test('does not promote reused dependencies or import-only execution to acceptance', () => {
    const results = readText('docs/evaluation-results/v0.5.0-candidate.md');
    for (const file of [
      'docs/compatibility.md',
      'docs/versioning.md',
      'docs/roadmap.md',
      'docs/evaluation-results/v0.5.0-candidate.md',
      'docs/post-v0.4.0-grouped-ledger-candidate-16-evaluation-plan.md',
    ]) {
      const document = readText(file).toLowerCase();
      expect(document).toContain('independent node dependency installation passed');
      expect(document).not.toContain('independent dependency installation remains unverified');
      expect(document).not.toContain('clean-tag installation smoke passes');
    }
    expect(results).toContain('was attempted but blocked by the network sandbox');
    expect(results).toContain('reused the already available local dependencies through a symlink');
    expect(results).toContain('Independent dependency installation was unverified at that stage');
    expect(results).toContain('That command executed no report validation');
    expect(results).toContain('must not be described as a complete fresh-install');
    expect(readText('docs/roadmap.md')).toContain('## Current Next Steps');
  });

  test('limits the new installation pass to its clean local tag and Node dependency scope', () => {
    const recordPath = 'evaluation/runtime-windows/v0.5.0-independent-installation-result.json';
    const raw = readText(recordPath);
    const result = JSON.parse(raw);
    const resultsDocument = readText('docs/evaluation-results/v0.5.0-candidate.md');

    expect(result).toMatchObject({
      status: 'pass',
      scope: 'clean-local-tag-node-dependency-installation',
      baseline: {
        tag: 'v0.5.0',
        commit: '0b236c45d0f469f784f1ea77b1a94e79de5e8059',
        source: 'local-repository-clone',
        remoteTagDownloadVerified: false,
      },
      isolation: {
        freshCheckout: true, freshHome: true, freshStore: true, freshCache: true,
        nodeModulesInitiallyAbsent: true, nodeModulesRootIsSymlink: false,
        vitestResolvedInsideCheckout: true, packageImportMethod: 'copy',
      },
      install: { exitCode: 0, downloaded: 45, added: 45, reused: 0 },
      verification: {
        vitest: { exitCode: 0, filesPassed: 36, filesTotal: 36, testsPassed: 198, testsTotal: 198 },
        repositorySkillValidator: 'pass', officialSkillValidator: 'pass',
        pythonDependency: 'reused-separately-validated-temporary-pyyaml',
        freshPythonDependencyInstallVerified: false,
      },
      integrity: {
        baselineTrackedFileCount: 290,
        lockfileSha256: '4424546d2638cf723d93a838d6999218b20af65d2ceedbbb61ab506c6aa6e728',
        lockfileUnchanged: true, checkoutTrackedAndUntrackedUnchanged: true,
        sourceInventoryUnchanged: true,
      },
      transfer: { publicPackageRegistryAccess: true, externalModelRequests: 0, sourceTransmitted: false },
      boundaries: {
        earlierBlockedInstallRetained: true, earlierDependencyReuseNotPromoted: true,
        clientRuntimeAcceptanceAdded: false, skillBehaviorChanged: false,
        globalDependenciesChanged: false, temporaryDataCleanupExecuted: false,
      },
    });
    expect(result.install.command).toContain('--frozen-lockfile');
    expect(raw).not.toMatch(/\/Users\/|\/private\/|\/var\/folders\//u);
    expect(resultsDocument).toContain(recordPath);
    expect(resultsDocument).toContain('These counts describe the released tag');
    expect(resultsDocument).toMatch(/\| Codex \|[^\n]*\| Cannot Verify \|/u);
    expect(resultsDocument).toMatch(/\| Claude Code \|[^\n]*\| Cannot Verify \|/u);
  });

  test('retains the invalid control and promotes only the replacement Fix result', () => {
    const result = JSON.parse(
      readText('evaluation/runtime-windows/v0.5.0-current-tree-fix-acceptance-result.json'),
    ) as Record<string, any>;
    const resultsDocument = readText('docs/evaluation-results/v0.5.0-candidate.md');
    const packageJson = JSON.parse(readText('package.json')) as {
      scripts: Record<string, string>;
    };

    expect(result).toMatchObject({
      status: 'pass-after-retained-unscored-control-conflict',
      skill: {
        treeSha256: '148cf6ebae8c5cba674f5fe0fe9f1399f405287b5057d815867662faa1721480',
        fileCount: 12,
      },
      attempt01: {
        decision: 'Cannot Score',
        semanticOracle: 'pass-but-not-promoted',
        workspaceUnchanged: true,
      },
      attempt02: {
        decision: 'Pass',
        prompt: {
          previousFindingsException: '.evaluation/previous-findings.md only',
        },
        run: {
          toolCalls: 13,
          shellCalls: 0,
          mcpCalls: 0,
          failedToolCalls: 0,
          outsideWorkspaceReads: 0,
          workspaceMutationObserved: false,
        },
        runtimeAudit: {
          valid: true,
          violations: [],
          workspaceStatusUnchanged: true,
        },
        outputValidator: {
          mode: 'fix',
          valid: true,
          findingIds: ['F-001', 'F-002', 'F-003'],
        },
        semanticOracle: {
          valid: true,
          newRegression: 'none',
          recommendation: '可以关闭',
          fullDeepReviewExpansionObserved: false,
          errors: [],
        },
      },
      transferPolicy: {
        externalModelRequests: 2,
        scoredSourceBearingRequests: 1,
        unscoredSourceBearingRequests: 1,
        privateSourceTransmitted: false,
        oracleTransmitted: false,
      },
      decision: {
        currentTreeFixGate: 'Pass',
        releaseCandidate: 'Continue',
      },
    });
    expect(result.attempt02.semanticOracle.findingStatuses).toEqual({
      'F-001': { originalSeverity: 'Blocking', status: 'Resolved' },
      'F-002': { originalSeverity: 'Blocking', status: 'Resolved' },
      'F-003': { originalSeverity: 'Risk', status: 'Resolved' },
    });
    expect(resultsDocument).toContain('Status: published stable release');
    expect(resultsDocument).toContain('retained as `Cannot Score`');
    expect(resultsDocument).toContain('Exact-current-tree source-free, Quick, Deep, and Fix gates pass');
    expect(packageJson.scripts['evaluation:prepare-v0.5.0-release-acceptance']).toBe(
      'node scripts/prepare-v0.5.0-release-acceptance.mjs',
    );
  });
});

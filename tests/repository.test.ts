import { describe, expect, test } from 'vitest';

import { exists, readText } from './test-utils';

function markdownSection(markdown: string, heading: string): string {
  const start = markdown.indexOf(heading);

  if (start === -1) {
    throw new Error(`Missing Markdown section: ${heading}`);
  }

  const remaining = markdown.slice(start + heading.length);
  const nextHeading = remaining.search(/\n## /);
  return nextHeading === -1 ? remaining : remaining.slice(0, nextHeading);
}

function markdownTableRow(markdown: string, firstCell: string): string {
  const row = markdown.split('\n').find((line) => line.startsWith(`| ${firstCell} |`));

  if (!row) {
    throw new Error(`Missing Markdown table row: ${firstCell}`);
  }

  return row;
}

describe('repository release support', () => {
  test('documents local evaluation expectations', () => {
    const evaluation = readText('docs/evaluation.md');

    expect(evaluation).toContain('Use this checklist before publishing');
    expect(evaluation).toContain('untracked file referenced by tracked changes');
    expect(evaluation).toContain('One Fix Review');
    expect(evaluation).toContain('before/after behavior');
    expect(evaluation).toContain('New Regression：新增回归');
    expect(evaluation).toContain('Quick decision');
    expect(evaluation).toContain('Forbidden design outcome');
    expect(evaluation).toContain('A case passes only when the expected design decision is produced');
    expect(evaluation).toContain('unrelated correctness, test, or release findings');
    expect(evaluation).toContain('quick_validate.py skills/fe-code-review');
    expect(evaluation).toContain('总体结论');
    expect(evaluation).toContain('Evidence');
    expect(evaluation).toContain('--require-context-collector');
    expect(exists('examples/outputs/fix-review.zh-CN.md')).toBe(true);
  });

  test('documents the v0.3.0 real-project evaluation baseline', () => {
    const readme = readText('README.md');
    const chineseReadme = readText('README.zh-CN.md');
    const evaluation = readText('docs/evaluation.md');
    const roadmap = readText('docs/roadmap.md');
    const plan = readText('docs/v0.3.0-real-project-evaluation-plan.md');
    const record = readText('docs/real-project-evaluation-record-template.md');

    expect(readme).toContain('docs/v0.3.0-real-project-evaluation-plan.md');
    expect(readme).toContain('docs/real-project-evaluation-record-template.md');
    expect(chineseReadme).toContain('v0.3.0 真实项目评测计划');
    expect(chineseReadme).toContain('真实项目评测记录模板');
    expect(evaluation).toContain('Real-project Evaluation Plan');
    expect(roadmap).toContain('## v0.3.0 Real-project Evaluation Baseline');

    for (const phrase of [
      'React and TypeScript',
      'Vue and TypeScript',
      'Hybrid or WebView',
      'Required-finding recall',
      'Finding precision',
      'Suggested-fix quality',
      'Minimal-design accuracy',
      'Read-only violations',
      'Fix scope expansion',
      'features.plugins=false',
      'features.remote_plugin=false',
      'source-free probe',
      'CLIENT_ISOLATION_OK',
      'Prospective Fix Replacement Window',
      'exactly three source-bearing runs',
      'byte-identical unchanged repeat',
    ]) {
      expect(plan).toContain(phrase);
    }

    expect(plan).toContain('retain every failed run');
    expect(plan).toContain('stops the replacement window at `No-Go`');

    expect(roadmap).toContain(
      'Token reduction or plugin-eval cost alone is not sufficient evidence',
    );

    for (const phrase of [
      'Authorization And Privacy',
      'Evaluator-only Expectations',
      'Finding Adjudication',
      'Required-finding Recall',
      'Output-contract Verification',
      'Fix Review Verification',
      'Post-run Integrity',
      'Context collector execution contract',
      'Client network-isolation',
      '`Valid`, `False Positive`, or `Cannot Verify`',
    ]) {
      expect(record).toContain(phrase);
    }
  });

  test('defines GitHub Actions CI', () => {
    const ci = readText('.github/workflows/ci.yml');

    expect(ci).toContain('pnpm install --frozen-lockfile');
    expect(ci).toContain('pnpm test');
    expect(ci).toContain('python -m pip install PyYAML==6.0.3');
    expect(ci).toContain('python scripts/quick_validate.py skills/fe-code-review');
  });

  test('ships a repository-local skill validator for CI', () => {
    expect(exists('scripts/quick_validate.py')).toBe(true);

    const validator = readText('scripts/quick_validate.py');
    expect(validator).toContain('frontmatter.name is required');
    expect(validator).toContain('Skill is valid!');
  });

  test('ships an evaluator-only review output validator', () => {
    const packageJson = JSON.parse(readText('package.json')) as {
      scripts: Record<string, string>;
    };
    const validator = readText('scripts/validate-review-output.mjs');

    expect(exists('scripts/validate-review-output.mjs')).toBe(true);
    expect(exists('tests/review-output-validator.test.ts')).toBe(true);
    expect(packageJson.scripts['evaluation:review-output']).toBe(
      'node scripts/validate-review-output.mjs',
    );
    expect(validator).toContain('coverage-ledger-section-count');
    expect(validator).toContain('blocking-outcome-unsupported');
    expect(validator).not.toContain('writeFile');
  });

  test('documents the candidate version and stable bilingual installation evidence', () => {
    const packageJson = JSON.parse(readText('package.json')) as { version: string };
    const readme = readText('README.md');
    const chineseReadme = readText('README.zh-CN.md');
    const compatibility = readText('docs/compatibility.md');

    expect(packageJson.version).toBe('0.4.0');
    expect(readme).toContain('README.zh-CN.md');
    expect(readme).toContain('--branch v0.3.0');
    expect(readme).toContain('Runtime verified');
    expect(readme).toContain('### Stable v0.3.0');
    expect(readme).not.toContain('### v0.3.0 Release Candidate');
    expect(readme).toContain('part of stable `v0.2.0`');
    expect(chineseReadme).toContain('安装稳定版本');
    expect(chineseReadme).toContain('--branch v0.3.0');
    expect(chineseReadme).toContain('Cannot Verify：无法验证');
    expect(chineseReadme).toContain('### 稳定版 v0.3.0');
    expect(chineseReadme).not.toContain('### v0.3.0 候选版本');
    expect(chineseReadme).toContain('属于稳定版 `v0.2.0`');
    expect(compatibility).toContain('Structural verified');
    expect(compatibility).toContain('Stable evidence baseline: [`v0.3.0`]');
    expect(compatibility).toContain('Candidate under test: `v0.4.0`');
    expect(compatibility).toContain('## v0.4.0 Release Candidate Evidence');
    expect(compatibility).toContain('## Stable v0.3.0 Evidence');
    expect(compatibility).toContain('a66e26e60e27f643f35b402c6660038c7070e759');
  });

  test('associates compatibility evidence with the correct client and release contract', () => {
    const readme = readText('README.md');
    const compatibility = readText('docs/compatibility.md');
    const roadmap = readText('docs/roadmap.md');
    const results = readText('docs/evaluation-results/v0.2.0.md');
    const historical = markdownSection(compatibility, '## Historical v0.1.1 Evidence');
    const stable = markdownSection(compatibility, '## Stable v0.3.0 Evidence');
    const historicalV022 = markdownSection(compatibility, '## Historical v0.2.2 Evidence');
    const limitations = markdownSection(compatibility, '## Known Limitations');
    const historicalClaudeRow = markdownTableRow(historical, 'Claude Code');
    const historicalCursorRow = markdownTableRow(historical, 'Cursor');
    const stableCodexRow = markdownTableRow(stable, 'Codex CLI 0.146.0');
    const stableCursorRow = markdownTableRow(stable, 'Cursor');
    const stableClaudeRow = markdownTableRow(stable, 'Claude Code');
    const historicalV022CursorRow = markdownTableRow(
      historicalV022,
      'Cursor Agent CLI 2026.08.04-aaa8809',
    );
    const readmeStable = markdownSection(readme, '### Stable v0.3.0');
    const readmeCursorRow = markdownTableRow(
      readmeStable,
      'Cursor',
    );
    const resultsCursorRow = markdownTableRow(results, 'Cursor');

    expect(historicalClaudeRow).toContain('Not executed because the available account subscription expired');
    expect(historicalClaudeRow).toMatch(/\| Cannot Verify \|$/);

    expect(historicalCursorRow).toContain('v0.1.0 Quick Review');
    expect(historicalCursorRow).toMatch(/\| Runtime verified \|$/);
    expect(historicalCursorRow).not.toContain('Deep');
    expect(historicalCursorRow).not.toContain('Fix');
    expect(stable).toContain('materially extends changed-condition review');
    expect(stableCodexRow).toContain('prospective Fix replacement window passes `3 / 3`');
    expect(stableCodexRow).toMatch(/\| Runtime verified \|$/);
    expect(stableCursorRow).toContain('failed one or more workspace-isolation');
    expect(stableCursorRow).toMatch(/\| Cannot Verify \|$/);
    expect(historicalV022CursorRow).toContain('Candidate Deep/Fix and post-release Quick reviews');
    expect(historicalV022CursorRow).toContain('119 events and 15 tool calls');
    expect(historicalV022CursorRow).toMatch(/\| Runtime verified \|$/);
    expect(readmeCursorRow).toMatch(/\| `Cannot Verify` \|$/);
    expect(resultsCursorRow).toContain('| Runtime verified |');
    expect(roadmap).toContain('post-hardening Cursor CLI Improve-only Quick rerun');
    expect(roadmap).toContain('post-hardening final Deep Review passed against the committed candidate');
    expect(roadmap).not.toContain('final Deep Review against an immutable commit candidate after commit approval');
    expect(stableClaudeRow).toContain('valid runtime credentials are unavailable');
    expect(stableClaudeRow).toMatch(/\| Cannot Verify \|$/);
    expect(limitations).toContain('Cursor and Claude Code v0.3.0 runtime behavior is not claimed');
    expect(limitations).toContain('fresh-tag Quick smoke passed trace/read-only gates');
    expect(limitations).toContain('Codex v0.2.2 post-release runtime evidence covers the Quick fixture');
    expect(limitations).toContain('user-level Memory and plugin context');
    expect(limitations).toContain('manual synthetic-fixture dataset');
    expect(limitations).toContain('No v0.2.2 result claims browser runtime evidence');
  });

  test('documents the public review output contract and examples', () => {
    const readme = readText('README.md');
    const chineseReadme = readText('README.zh-CN.md');

    expect(readme).toContain('## Review Output');
    expect(readme).toContain('trigger condition, impact, root cause, suggested fix');
    expect(readme).toContain('Resolved`, `Partially Resolved`, `Unresolved`, or `Cannot Verify`');
    expect(readme).toContain('examples/outputs/quick-review.zh-CN.md');
    expect(readme).toContain('examples/outputs/deep-review.md');
    expect(readme).toContain('examples/outputs/fix-review.zh-CN.md');

    expect(chineseReadme).toContain('## 输出结果说明');
    expect(chineseReadme).toContain('可以提交`、`修改后提交`、`不建议提交');
    expect(chineseReadme).toContain('Blocking：必须修改');
    expect(chineseReadme).toContain('Cannot Verify：无法验证');
    expect(chineseReadme).toContain('总体结论和最终建议必须是同一个决策合同');
    expect(chineseReadme).toContain('该优化不影响提交');
    expect(readme).toContain('The conclusion and final recommendation are one decision contract');
  });

  test('documents permitted documentation evidence and conditional browser evidence', () => {
    const readme = readText('README.md');
    const chineseReadme = readText('README.zh-CN.md');
    const evaluation = readText('docs/evaluation.md');
    const compatibility = readText('docs/compatibility.md');
    const englishEvidence = markdownSection(readme, '### Documentation and Browser Evidence');
    const chineseEvidence = markdownSection(chineseReadme, '### 官方文档与浏览器证据');

    for (const phrase of [
      'remain the primary evidence',
      'directly or indirectly',
      'delegation',
      'proxy',
      'reframed request',
      'controlled and repeatable initial state',
      'reconstructed before each run without production data or a real account',
      'explicit expected observation',
      'destructive or irreversible side effects',
      'reuse the original environment, initial state, reproduction steps, and observable assertions',
      'evidence from a different environment may be reported separately but cannot support `Resolved`',
    ]) {
      expect(englishEvidence).toContain(phrase);
    }

    for (const phrase of [
      '仓库源码、调用链、锁文件',
      '不得直接或间接使用 Context7',
      '委派给 subagent',
      '通过代理工具调用',
      '改写问题以绕过限制',
      '初始状态可控且可重复',
      '可在每次运行前重建',
      '不依赖生产数据或真实账号',
      '预期观察结果明确',
      '破坏性或不可逆副作用',
      '必须复用原问题的环境、初始状态、复现步骤和可观察断言',
      '不同环境的结果可以单独记录，但不能据此标记 `Resolved：已解决`',
    ]) {
      expect(chineseEvidence).toContain(phrase);
    }

    expect(readme).toContain('complete it with the Fix Review template and budget');
    expect(readme).toContain('recommend a separate Deep Review');
    expect(readme).toContain('Do not merge the two modes into one report');
    expect(chineseReadme).toContain('按 Fix Review 的模板和预算完成当前回审');
    expect(chineseReadme).toContain('建议独立执行 Deep Review');
    expect(chineseReadme).toContain('不得把两种模式混成一份报告');

    expect(evaluation).toContain('## Documentation Evidence Expectations');
    expect(evaluation).toContain('## Conditional Browser Runtime Evidence Expectations');
    expect(evaluation).toContain('absence of browser automation is not itself a finding');
    expect(evaluation).toContain('must not be presented as verification of a real WebView, Native bridge');
    expect(compatibility).toContain('Browser automation is optional');
    expect(compatibility).toContain('marks affected runtime claims `Cannot Verify`');

    const examples = [
      {
        path: 'examples/outputs/quick-review.md',
        fields: ['Official documentation verification:', 'Browser runtime evidence:', 'Unverified:'],
      },
      {
        path: 'examples/outputs/deep-review.md',
        fields: ['Official documentation verification:', 'Browser runtime evidence:', 'Unverified:'],
      },
      {
        path: 'examples/outputs/quick-review.zh-CN.md',
        fields: ['官方文档核验：', '浏览器运行证据：', '未验证：'],
      },
      {
        path: 'examples/outputs/fix-review.zh-CN.md',
        fields: ['官方文档核验：', '浏览器运行证据：', '未验证：'],
      },
    ];

    for (const example of examples) {
      const output = readText(example.path);

      for (const field of example.fields) {
        expect(output).toContain(field);
      }

      expect(output).not.toContain('Official docs / Context7:');
      expect(output).not.toContain('官方文档 / Context7：');
    }

    expect(readText('examples/outputs/fix-review.zh-CN.md')).toContain(
      '不属于原 findings 的验收条件，因此不改变上方回审状态',
    );
  });

  test('records release history and semantic version rules', () => {
    const changelog = readText('CHANGELOG.md');
    const versioning = readText('docs/versioning.md');

    expect(changelog).toContain('## [Unreleased]');
    expect(changelog).toContain('## [0.3.0] - 2026-08-20');
    expect(changelog).toContain('## [0.2.2] - 2026-08-06');
    expect(changelog).toContain('## [0.2.1] - 2026-08-05');
    expect(changelog).toContain('## [0.2.0] - 2026-07-31');
    expect(changelog).toContain('## [0.1.1] - 2026-07-23');
    expect(changelog).toContain('## [0.1.0] - 2026-07-23');
    expect(changelog).toContain('compare/v0.3.0...HEAD');
    expect(changelog).toContain('Completed Candidate 08 at `7 / 7`');
    expect(changelog).toContain('[0.3.0]: https://github.com/keykovar/skill-fe-code-review/compare/v0.2.2...v0.3.0');
    expect(changelog).toContain('compare/v0.2.1...v0.2.2');
    expect(changelog).toContain('compare/v0.2.0...v0.2.1');
    expect(changelog).toContain('compare/v0.1.1...v0.2.0');
    expect(changelog).not.toContain('compare/v0.1.1...HEAD');
    expect(versioning).toContain('Patch');
    expect(versioning).toContain('Minor');
    expect(versioning).toContain('Major');
    expect(versioning).toContain('Release tags are immutable');
    expect(versioning).toContain('Cannot Verify');
    expect(versioning).toContain('Stable: `v0.3.0`');
    expect(versioning).toContain('Previous stable: `v0.2.2`');
    expect(versioning).toContain('Release candidate: `v0.4.0`');
    expect(versioning).not.toContain('Release candidate: `v0.3.0`');
  });

  test('ships issue forms and an evidence-driven roadmap', () => {
    expect(exists('.github/ISSUE_TEMPLATE/bug_report.yml')).toBe(true);
    expect(exists('.github/ISSUE_TEMPLATE/feature_request.yml')).toBe(true);
    expect(exists('.github/ISSUE_TEMPLATE/config.yml')).toBe(true);

    const roadmap = readText('docs/roadmap.md');
    expect(roadmap).toContain('Post-v0.2.2 Candidates');
    expect(roadmap).toContain('Completed v0.2.2 Promotion Evidence');
    expect(roadmap).toContain('v0.2.0 Release Boundaries');
    expect(roadmap).toContain('finding IDs');
    expect(roadmap).toContain('v0.4.0-finding-identity-evaluation-plan.md');
    expect(roadmap).toContain('Automatic code edits');
  });

  test('records Candidate 01 through Candidate 07 and promotes Candidate 08 after tooling replay', () => {
    const plan = readText('docs/v0.4.0-finding-identity-evaluation-plan.md');
    const manifest = JSON.parse(
      readText('evaluation/runtime-windows/v0.4.0-finding-identity.json'),
    );
    const candidate02 = JSON.parse(
      readText('evaluation/runtime-windows/v0.4.0-finding-identity-candidate-02.json'),
    );
    const candidate02Probe = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-02-probe-result.json',
      ),
    );
    const candidate02Results = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-02-results.json',
      ),
    );
    const candidate03Plan = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-03-plan.json',
      ),
    );
    const candidate03Probe = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-03-probe-result.json',
      ),
    );
    const candidate03Results = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-03-results.json',
      ),
    );
    const candidate03ToolingReplay = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-03-tooling-replay.json',
      ),
    );
    const candidate04Plan = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-04-plan.json',
      ),
    );
    const candidate04Probe = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-04-probe-result.json',
      ),
    );
    const candidate04Results = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-04-results.json',
      ),
    );
    const candidate05Plan = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-05-plan.json',
      ),
    );
    const candidate05ProbeAttempt01 = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-05-probe-attempt-01-result.json',
      ),
    );
    const candidate05ProbeAttempt02 = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-05-probe-attempt-02-result.json',
      ),
    );
    const candidate05Stage1Results = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-05-stage-1-results.json',
      ),
    );
    const candidate05Results = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-05-results.json',
      ),
    );
    const candidate06Plan = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-06-plan.json',
      ),
    );
    const candidate06ProbeResult = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-06-probe-result.json',
      ),
    );
    const candidate06Stage1Results = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-06-stage-1-results.json',
      ),
    );
    const candidate07Plan = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-07-plan.json',
      ),
    );
    const candidate07ProbeAttempt01 = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-07-probe-attempt-01-result.json',
      ),
    );
    const candidate07ProbeAttempt02 = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-07-probe-attempt-02-result.json',
      ),
    );
    const candidate07Stage1Results = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-07-stage-1-results.json',
      ),
    );
    const candidate07Results = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-07-results.json',
      ),
    );
    const candidate08Plan = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-08-plan.json',
      ),
    );
    const candidate08ProbeResult = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-08-probe-result.json',
      ),
    );
    const candidate08Stage1Results = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-08-stage-1-results.json',
      ),
    );
    const candidate08Results = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-08-results.json',
      ),
    );
    const candidate08ToolingReplay = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-08-tooling-replay.json',
      ),
    );

    const probeResult = JSON.parse(
      readText('evaluation/runtime-windows/v0.4.0-finding-identity-probe-result.json'),
    );
    const replacementPlan = JSON.parse(
      readText('evaluation/runtime-windows/v0.4.0-finding-identity-plan-02.json'),
    );
    const replacementProbeResult = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-plan-02-probe-result.json',
      ),
    );
    const windowResults = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-plan-02-results.json',
      ),
    );
    const toolingReplay = JSON.parse(
      readText(
        'evaluation/runtime-windows/v0.4.0-finding-identity-tooling-replay.json',
      ),
    );
    const publishedResults = readText('docs/evaluation-results/v0.4.0-candidate.md');

    expect(plan).toContain('Status: Phase 12 Candidate 08 `Go` at `7 / 7`');
    expect(plan).toContain('independent-finding recall remained `2 / 3`');
    expect(plan).toContain('`F-001`, `F-002`');
    expect(plan).toContain('one Initial Review to Fix Review chain');
    expect(plan).toContain('does not satisfy Finding coverage');
    expect(plan).toContain('The window contains exactly seven source-bearing runs');
    expect(plan).toContain('Independent-finding recall');
    expect(plan).toContain('Section-leakage rate');
    expect(plan).toContain('Fix ID preservation');
    expect(plan).toContain('do not make Vitest assert model-generated prose');
    expect(plan).toContain('pnpm fixture:prepare quick-identity');
    expect(plan).toContain('pnpm fixture:prepare deep-identity');
    expect(plan).toContain('`SKILL.md` net growth is `90 / 90` words');
    expect(plan).toContain('1b70a8281abc7e8ec2c95f829fda59c94ee65ac504dd7c5ea9ab70729e9f3882');
    expect(plan).toContain('Use `v0.4.0` only if all seven source-bearing runs');
    expect(manifest.status).toBe('frozen-source-free-probe-pending');
    expect(manifest.sourcePolicy.sourceTransmitted).toBe(false);
    expect(manifest.runOrder).toHaveLength(7);
    expect(manifest.runOrder.map((run: { sequence: number }) => run.sequence)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(manifest.candidateHashes['skills/fe-code-review/SKILL.md']).toBe(
      '1b70a8281abc7e8ec2c95f829fda59c94ee65ac504dd7c5ea9ab70729e9f3882',
    );
    expect(probeResult.status).toBe('fail-window-stopped');
    expect(probeResult.sourceTransmitted).toBe(false);
    expect(probeResult.result.mandatoryGatePassed).toBe(false);
    expect(replacementPlan.status).toBe('replacement-window-frozen-probe-pending');
    expect(replacementPlan.carryForward.sourceBearingResults).toBe(false);
    expect(replacementPlan.clientWindow.mcpServersExplicitlyDisabled).toHaveLength(9);
    expect(replacementProbeResult.status).toBe(
      'pass-source-bearing-authorization-pending',
    );
    expect(replacementProbeResult.sourceTransmitted).toBe(false);
    expect(replacementProbeResult.result.mandatoryGatePassed).toBe(true);
    expect(replacementProbeResult.result.mcpProcessStarted).toBe(false);
    expect(windowResults.status).toBe('complete-no-go-after-tooling-replay');
    expect(windowResults.runs).toHaveLength(7);
    expect(windowResults.runsRetried).toBe(0);
    expect(windowResults.publicSyntheticSourceTransmitted).toBe(true);
    expect(windowResults.privateSourceTransmitted).toBe(false);
    expect(windowResults.mandatoryPassCount).toBe(4);
    expect(windowResults.metrics.independentFindingRecall).toBe('7/9');
    expect(windowResults.metrics.readOnlyIntegrityPass).toBe('7/7');
    expect(windowResults.decision).toBe('No-Go');
    expect(toolingReplay.status).toBe('complete-pass');
    expect(toolingReplay.modelCalls).toBe(0);
    expect(toolingReplay.replayedTraces).toHaveLength(2);
    expect(publishedResults).toContain('`4 / 7` runs pass every mandatory gate');
    expect(publishedResults).toContain('`0 / 2` independently matched concepts');
    expect(publishedResults).toContain(
      'No model call or source transmission occurred during replay',
    );
    expect(candidate02.status).toBe(
      'source-free-probe-passed-source-bearing-authorization-pending',
    );
    expect(candidate02.sourcePolicy.sourceTransmitted).toBe(false);
    expect(candidate02.candidateHashes['skills/fe-code-review/SKILL.md']).toBe(
      '6de256f26677d90af48c6b3edd4d1d75e042f92bb6f0339c4a6840de98285b68',
    );
    expect(candidate02.instructionGrowth).toEqual({
      skillMdWords: '88/90',
      modeReferenceWords: '111/120',
    });
    expect(candidate02.staticValidation).toMatchObject({
      vitest: '8/8 files; 91/91 tests',
      repositoryValidator: 'pass',
      officialSkillValidator: 'pass',
      candidateHashMatch: '4/4',
      gitDiffCheck: 'pass',
    });
    expect(candidate02.severityOracle).toMatchObject({
      finding: 'ignored-timeout-contract',
      allowedSeverities: ['Risk'],
      decision: 'retained',
    });
    expect(candidate02.carryForward).toMatchObject({
      preparedWorkspaceHashes: false,
      sourceBearingResults: false,
      sourceFreeProbeResult: false,
    });
    expect(candidate02.prospectiveRunOrder).toHaveLength(7);
    expect(candidate02.clientWindow).toMatchObject({
      client: 'Codex CLI 0.146.0',
      provider: 'Joymeet',
      model: 'gpt-5.5',
      httpRetries: 0,
      sseRetries: 0,
    });
    expect(candidate02.clientWindow.mcpServersExplicitlyDisabled).toHaveLength(9);
    expect(candidate02.preparedWorkspaces).toHaveLength(7);
    expect(
      candidate02.preparedWorkspaces.every(
        (workspace: { actualTestExitCode: number; expectedTestExitCode: number }) =>
          workspace.actualTestExitCode === workspace.expectedTestExitCode,
      ),
    ).toBe(true);
    expect(candidate02.workspaceIntegrity).toMatchObject({
      expectedTestResultsMatched: '7/7',
      candidateSkillHashesMatched: '7/7',
      agentCursorSkillCopiesMatched: '7/7',
      cursorAdapterCopiesMatched: '7/7',
    });
    expect(candidate02.repeatAssertions).toHaveLength(2);
    expect(candidate02.sourceFreeProbeResult).toBe(
      'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-02-probe-result.json',
    );
    expect(candidate02Probe.status).toBe('pass-source-bearing-authorization-pending');
    expect(candidate02Probe.sourceTransmitted).toBe(false);
    expect(candidate02Probe.result).toMatchObject({
      mandatoryGatePassed: true,
      processExitCode: 0,
      decodedResponse: 'CLIENT_ISOLATION_OK',
      agentMessages: 1,
      toolCalls: 0,
      mcpToolCalls: 0,
      mcpProcessStarted: false,
      undisclosedEndpointSignals: 0,
      retrySignals: 0,
      auditorValid: true,
    });
    expect(candidate02Probe.workspaceIntegrityAfterProbe.unchanged).toBe('7/7');
    expect(candidate02Results.status).toBe('complete-no-go');
    expect(candidate02Results.runs).toHaveLength(7);
    expect(candidate02Results.runsRetried).toBe(0);
    expect(candidate02Results.publicSyntheticSourceTransmitted).toBe(true);
    expect(candidate02Results.privateSourceTransmitted).toBe(false);
    expect(candidate02Results.mandatoryPassCount).toBe(4);
    expect(candidate02Results.metrics).toMatchObject({
      independentFindingRecall: '8/9',
      initialRepeatIdentityStability: '0/2',
      fixIdPreservation: '6/6',
      readOnlyIntegrityPass: '7/7',
    });
    expect(candidate02Results.integrity.workspaceTreeHashesUnchanged).toBe('7/7');
    expect(candidate02Results.decision).toBe('No-Go');
    expect(candidate03Plan.status).toBe('complete-no-go');
    expect(candidate03Plan.sourcePolicy.sourceTransmitted).toBe(true);
    expect(candidate03Plan.predecessor).toMatchObject({
      decision: 'No-Go',
      mandatoryPassCount: 4,
      mandatoryRunCount: 7,
    });
    expect(candidate03Plan.runtimeContract).toMatchObject({
      quickAndDeepCoverageLedger: { visible: true },
      blockingOutcomeField: {
        requiredForBlocking: true,
        localTestFailureAloneIsSufficient: false,
      },
    });
    expect(candidate03Plan.deterministicEvaluationValidator).toMatchObject({
      runtimeDependency: false,
      modelMustInvoke: false,
      writesReviewArtifacts: false,
    });
    expect(candidate03Plan.implementation).toMatchObject({
      netEnglishWords: {
        skillMd: 13,
        quickAndDeepReferences: 85,
        fixReference: 0,
      },
      fixReferenceUnchanged: true,
      validator: {
        path: 'scripts/validate-review-output.mjs',
        test: 'tests/review-output-validator.test.ts',
      },
    });
    expect(candidate03Plan.staticValidation).toMatchObject({
      vitest: '9/9 files; 101/101 tests',
      reviewOutputValidatorTests: '9/9',
      repositoryValidator: 'pass',
      officialSkillValidator: 'pass',
      candidateHashAndWordBudget: '5/5',
      gitDiffCheck: 'pass',
    });
    expect(candidate03Plan.prospectiveWindow).toMatchObject({
      sourceBearingRuns: 7,
      freshWorkspacesRequired: true,
      freshSourceFreeProbeRequired: true,
      carryForwardSourceBearingResults: false,
    });
    expect(candidate03Plan.preparedWorkspaces).toHaveLength(7);
    expect(
      candidate03Plan.preparedWorkspaces.every(
        (workspace: { actualTestExitCode: number; expectedTestExitCode: number }) =>
          workspace.actualTestExitCode === workspace.expectedTestExitCode,
      ),
    ).toBe(true);
    expect(candidate03Plan.workspaceIntegrity).toMatchObject({
      expectedTestResultsMatched: '7/7',
      candidateSkillHashesMatched: '7/7',
      agentCursorSkillCopiesMatched: '7/7',
      cursorAdapterCopiesMatched: '7/7',
      evaluatorValidatorCopiedIntoRuntime: false,
    });
    expect(candidate03Plan.repeatAssertions).toHaveLength(2);
    expect(candidate03Plan.sourceFreeProbeResult).toBe(
      'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-03-probe-result.json',
    );
    expect(candidate03Plan.sourceBearingResult).toBe(
      'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-03-results.json',
    );
    expect(candidate03Plan.toolingReplayResult).toBe(
      'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-03-tooling-replay.json',
    );
    expect(candidate03Probe.status).toBe('pass-source-bearing-authorization-pending');
    expect(candidate03Probe.sourceTransmitted).toBe(false);
    expect(candidate03Probe.result).toMatchObject({
      mandatoryGatePassed: true,
      processExitCode: 0,
      decodedResponse: 'CLIENT_ISOLATION_OK',
      agentMessages: 1,
      toolCalls: 0,
      mcpToolCalls: 0,
      mcpProcessStarted: false,
      undisclosedEndpointSignals: 0,
      retrySignals: 0,
      auditorValid: true,
    });
    expect(candidate03Probe.workspaceIntegrityAfterProbe.unchanged).toBe('7/7');
    expect(candidate03Plan.promotionGates).toMatchObject({
      mandatoryRuns: '7/7',
      independentFindingRecall: '9/9',
      initialRepeatIdentityStability: '3/3',
      severityAccuracy: '9/9',
      readOnlyIntegrityPass: '7/7',
    });
    expect(candidate03Results.status).toBe('complete-no-go');
    expect(candidate03Results.runs).toHaveLength(7);
    expect(candidate03Results.runsRetried).toBe(0);
    expect(candidate03Results.publicSyntheticSourceTransmitted).toBe(true);
    expect(candidate03Results.privateSourceTransmitted).toBe(false);
    expect(candidate03Results.mandatoryPassCount).toBe(2);
    expect(candidate03Results.metrics).toMatchObject({
      independentFindingRecall: '8/9',
      initialRepeatIdentityStability: '2/3',
      fixIdPreservation: '3/6',
      structuralValidatorPass: '2/7',
      executionPass: '6/7',
      readOnlyIntegrityPass: '7/7',
    });
    expect(candidate03Results.integrity.workspaceTreeHashesUnchanged).toBe('7/7');
    expect(candidate03Results.decision).toBe('No-Go');
    expect(candidate03Results.toolingReplay).toBe(
      'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-03-tooling-replay.json',
    );
    expect(candidate03ToolingReplay).toMatchObject({
      status: 'complete-pass-tooling-only',
      modelCalls: 0,
      sourceTransmitted: false,
      runsRetried: 0,
      mandatoryPassCountBefore: 2,
      mandatoryPassCountAfter: 2,
    });
    expect(candidate03ToolingReplay.replayedOutputs).toHaveLength(6);
    expect(candidate03ToolingReplay.skippedOutputs).toHaveLength(1);
    expect(candidate04Plan.status).toBe(
      'complete-no-go',
    );
    expect(candidate04Plan.predecessor).toMatchObject({
      decision: 'No-Go',
      mandatoryPassCount: 2,
      mandatoryRunCount: 7,
    });
    expect(candidate04Plan.candidateContract).toMatchObject({
      findingHeader: {
        markdownLinkExtensionAllowed: true,
        backtickOnlyLocationAllowed: false,
      },
      blockingOutcome: {
        fieldMustBeginWithCanonicalCategory: true,
        localTestFailureAloneIsSufficient: false,
      },
      repeatedLedgerFindingId: {
        repeatedReferenceRequiresMergeKey: true,
        sameIdRequiresIdenticalNonEmptyKey: true,
      },
    });
    expect(candidate04Plan.candidateContract.blockingOutcome.categories).toHaveLength(11);
    expect(candidate04Plan.instructionBudgetRelativeToCandidate03).toEqual({
      skillMdNetWords: '<=60',
      quickAndDeepReferenceNetWords: '<=80',
      fixReferenceNetWords: '0',
      frontmatterNetWords: '0',
      validatorInstructionsLoadedAtRuntime: false,
    });
    expect(candidate04Plan.implementation).toMatchObject({
      netEnglishWords: {
        skillMd: 32,
        quickAndDeepReferences: 78,
        fixReference: 0,
        frontmatter: 0,
      },
      fixReferenceUnchanged: true,
      evaluator: {
        validatorPath: 'scripts/validate-review-output.mjs',
        testPath: 'tests/review-output-validator.test.ts',
      },
    });
    expect(candidate04Plan.preservedOutputReplay).toMatchObject({
      modelCalls: 0,
      sourceTransmitted: false,
      runsRetried: 0,
    });
    expect(candidate04Plan.preservedOutputReplay.results).toHaveLength(6);
    expect(candidate04Plan.staticValidation).toMatchObject({
      vitest: '9/9 files; 104/104 tests',
      reviewOutputValidatorTests: '12/12',
      repositoryValidator: 'pass',
      officialSkillValidator: 'pass',
      nodeSyntax: '3/3 scripts',
      jsonParse: '25/25 files',
      instructionBudget: '4/4',
      gitDiffCheck: 'pass',
    });
    expect(candidate04Plan.sourcePolicy).toMatchObject({
      visibility: 'public-synthetic-only',
      privateSourceAllowed: false,
      oracleReadableByModel: false,
      sourceTransmitted: true,
    });
    expect(candidate04Plan.preparedWorkspaces).toHaveLength(7);
    expect(
      candidate04Plan.preparedWorkspaces.every(
        (workspace: { actualTestExitCode: number; expectedTestExitCode: number }) =>
          workspace.actualTestExitCode === workspace.expectedTestExitCode,
      ),
    ).toBe(true);
    expect(candidate04Plan.workspaceIntegrity).toMatchObject({
      expectedTestResultsMatched: '7/7',
      candidateSkillHashesMatched: '7/7',
      agentCursorSkillCopiesMatched: '7/7',
      quickDeepFixReferenceHashesMatched: '21/21',
      cursorAdapterCopiesMatched: '7/7',
      previousFindingsHashesMatched: '2/2',
      evaluatorValidatorCopiedIntoRuntime: false,
    });
    expect(candidate04Plan.repeatAssertions).toHaveLength(2);
    expect(candidate04Plan.carryForward).toMatchObject({
      preparedWorkspaceHashes: false,
      sourceFreeProbeResult: false,
      sourceBearingResults: false,
    });
    expect(candidate04Plan.clientWindow).toMatchObject({
      client: 'Codex CLI 0.146.0',
      provider: 'Joymeet',
      model: 'gpt-5.5',
      httpRetries: 0,
      sseRetries: 0,
    });
    expect(candidate04Plan.clientWindow.mcpServersExplicitlyDisabled).toHaveLength(9);
    expect(candidate04Plan.sourceFreeProbeResult).toBe(
      'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-04-probe-result.json',
    );
    expect(candidate04Plan.sourceBearingResult).toBe(
      'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-04-results.json',
    );
    expect(candidate04Probe).toMatchObject({
      status: 'pass-source-bearing-authorization-pending',
      sourceTransmitted: false,
      result: {
        mandatoryGatePassed: true,
        processExitCode: 0,
        decodedResponse: 'CLIENT_ISOLATION_OK',
        decodedResponseBytes: 19,
        agentMessages: 1,
        toolCalls: 0,
        mcpToolCalls: 0,
        mcpProcessStarted: false,
        undisclosedEndpointSignals: 0,
        auditorValid: true,
        auditorViolations: 0,
      },
      workspaceIntegrityAfterProbe: {
        unchanged: '7/7',
        candidateHashesUnchanged: '7/7',
      },
    });
    expect(candidate04Plan.prospectiveWindow).toMatchObject({
      sourceBearingRuns: 7,
      freshWorkspacesRequired: true,
      freshSourceFreeProbeRequired: true,
      freshSourceBearingAuthorizationRequired: true,
      carryForwardSourceBearingResults: false,
      failedRunRetryPolicy: 'no-in-place-retry',
    });
    expect(candidate04Plan.promotionGates).toMatchObject({
      independentFindingRecall: '9/9',
      initialRepeatIdentityStability: '3/3',
      structuralValidatorPass: '7/7 applicable contracts',
      executionPass: '7/7',
      readOnlyIntegrityPass: '7/7',
    });
    expect(candidate04Results).toMatchObject({
      status: 'complete-no-go',
      sourceScope: 'seven-public-synthetic-workspaces',
      publicSyntheticSourceTransmitted: true,
      privateSourceTransmitted: false,
      runsExecuted: 7,
      runsRetried: 0,
      mandatoryPassCount: 6,
      mandatoryFailCount: 1,
      decision: 'No-Go',
    });
    expect(candidate04Results.runs).toHaveLength(7);
    expect(candidate04Results.runs[1]).toMatchObject({
      caseId: 'Q-ID-001',
      runId: 'RUN-02',
      mandatoryResult: 'Fail',
      semanticResult: 'Fail',
      executionResult: 'Pass',
      structuralValidatorResult: 'Fail',
      independentFindingRecall: '2/3',
      actualFindingIdsInRenderedOrder: ['F-002', 'F-001'],
    });
    expect(candidate04Results.metrics).toMatchObject({
      independentFindingRecall: '8/9',
      initialRepeatIdentityStability: '0/3',
      fixClosureCoverage: '6/6',
      fixIdPreservation: '6/6',
      severityAccuracy: '9/9',
      structuralValidatorPass: '6/7',
      executionPass: '7/7',
      readOnlyIntegrityPass: '7/7',
    });
    expect(candidate04Results.integrity).toMatchObject({
      workspaceStatusesUnchanged: '7/7',
      workspaceTreeHashesUnchanged: '7/7',
      candidateSkillHashesUnchanged: '7/7',
      applicableCollectorCallsExactlyOnce: '6/6',
      mcpToolCalls: 0,
      auditorViolations: 0,
      undisclosedEndpointSignals: 0,
      sourceBearingRetries: 0,
    });
    expect(candidate05Plan).toMatchObject({
      candidate: 'v0.4.0-finding-identity-candidate-05',
      status: 'complete-no-go',
      predecessor: {
        candidate: 'v0.4.0-finding-identity-candidate-04',
        decision: 'No-Go',
        mandatoryPassCount: 6,
        mandatoryRunCount: 7,
        failedRun: 'Q-ID-001 RUN-02',
      },
      sourcePolicy: {
        visibility: 'public-synthetic-only',
        privateSourceAllowed: false,
        sourceTransmitted: true,
        sourceTransmittedScope: 'seven-public-synthetic-workspaces',
      },
      instructionBudgetRelativeToCandidate04: {
        skillMdNetWords: '<=70',
        quickAndDeepReferenceNetWords: '<=30',
        fixReferenceNetWords: '0',
        frontmatterNetWords: '0',
        newVisibleOutputFields: 0,
        validatorInstructionsLoadedAtRuntime: false,
      },
    });
    expect(candidate05Plan.candidateContract.finalizationSequence).toHaveLength(8);
    expect(candidate05Plan.implementation).toMatchObject({
      candidate05EnglishWords: {
        skillMd: 3724,
        quickReference: 643,
        deepReference: 696,
        fixReference: 494,
      },
      netEnglishWords: {
        skillMd: 63,
        quickAndDeepReferences: -5,
        fixReference: 0,
        frontmatter: 0,
      },
      fixReferenceUnchanged: true,
      frontmatterUnchanged: true,
      visibleOutputTemplateFieldsAdded: 0,
      evaluator: {
        changedFromCandidate04: false,
        loadedAtRuntime: false,
      },
    });
    expect(candidate05Plan.staticValidation).toMatchObject({
      vitest: '9/9 files; 104/104 tests',
      repositoryValidator: 'pass',
      officialSkillValidator: 'pass',
      nodeSyntax: '3/3 scripts',
      jsonParse: '29/29 files',
      runtimeInstructionHashes: '4/4 recorded',
      instructionBudget: '6/6',
      gitDiffCheck: 'pass',
    });
    expect(candidate05Plan.prospectiveWindow).toMatchObject({
      sourceBearingRuns: 7,
      freshWorkspacesRequired: true,
      freshSourceFreeProbeRequired: true,
      freshSourceBearingAuthorizationRequired: true,
      carryForwardSourceBearingResults: false,
      failedRunRetryPolicy: 'no-in-place-retry',
      stage1: {
        runOrder: ['Q-ID-001 RUN-01', 'Q-ID-001 RUN-02'],
        continueOnlyIf: {
          mandatoryRuns: '2/2',
          independentFindingRecall: '6/6',
          findingIdOrder: '2/2 outputs',
          unchangedRepeatIdentityStability: '3/3',
          structuralValidatorPass: '2/2',
        },
      },
      stage2: {
        runOrder: [
          'Q-ID-002 RUN-01',
          'D-ID-001 RUN-01',
          'F-ID-001 RUN-01',
          'F-ID-001 RUN-02',
          'K-ID-001 RUN-01',
        ],
      },
    });
    expect(candidate05Plan.prospectiveWindow.stage1.runOrder).toHaveLength(2);
    expect(candidate05Plan.prospectiveWindow.stage2.runOrder).toHaveLength(5);
    expect(candidate05Plan.preparedWorkspaces).toHaveLength(7);
    expect(
      candidate05Plan.preparedWorkspaces.every(
        (workspace: { actualTestExitCode: number; expectedTestExitCode: number }) =>
          workspace.actualTestExitCode === workspace.expectedTestExitCode,
      ),
    ).toBe(true);
    expect(candidate05Plan.workspaceIntegrity).toMatchObject({
      expectedTestResultsMatched: '7/7',
      candidateSkillHashesMatched: '7/7',
      agentCursorSkillCopiesMatched: '7/7',
      quickDeepFixReferenceHashesMatched: '21/21',
      cursorAdapterCopiesMatched: '7/7',
      previousFindingsHashesMatched: '2/2',
      evaluatorValidatorCopiedIntoRuntime: false,
    });
    expect(candidate05Plan.repeatAssertions).toHaveLength(2);
    expect(candidate05Plan.clientWindow).toMatchObject({
      client: 'Codex CLI 0.146.0',
      provider: 'Joymeet',
      model: 'gpt-5.5',
      httpRetries: 0,
      sseRetries: 0,
    });
    expect(candidate05Plan.clientWindow.mcpServersExplicitlyDisabled).toHaveLength(9);
    expect(candidate05Plan.sourceFreeProbeAttempts).toEqual([
      expect.objectContaining({
        attemptId: 'source-free-probe-attempt-01',
        status: 'failed-client-preflight-no-provider-request-observed',
        sourceTransmitted: false,
        retry: false,
      }),
      expect.objectContaining({
        attemptId: 'source-free-probe-attempt-02',
        status: 'pass-source-bearing-stage-1-authorization-pending',
        sourceTransmitted: false,
        retry: false,
      }),
    ]);
    expect(candidate05Plan.replacementProbePlan).toMatchObject({
      attemptId: 'source-free-probe-attempt-02',
      status: 'pass-source-bearing-stage-1-authorization-pending',
      onlyCommandDelta: 'Add --skip-git-repo-check to the frozen source-free probe command.',
      freshAuthorizationRequired: true,
      sourceBearingAuthorized: false,
    });
    expect(candidate05ProbeAttempt01).toMatchObject({
      status: 'failed-client-preflight-no-provider-request-observed',
      sourceTransmitted: false,
      result: {
        mandatoryGatePassed: false,
        processExitCode: 1,
        elapsedSeconds: 1,
        failurePhase: 'client-preflight',
        decodedResponse: null,
        decodedResponseBytes: 0,
        agentMessages: 0,
        toolCalls: 0,
        mcpToolCalls: 0,
        traceEvents: 0,
        providerRequestObserved: false,
        retrySignals: 0,
        auditorRun: false,
      },
      workspaceIntegrityAfterAttempt: {
        unchanged: '7/7',
        candidateHashesUnchanged: '7/7',
        agentCursorTreesUnchanged: '14/14',
        repeatPairsUnchanged: '2/2',
      },
    });
    expect(candidate05ProbeAttempt02).toMatchObject({
      status: 'pass-source-bearing-stage-1-authorization-pending',
      sourceTransmitted: false,
      result: {
        mandatoryGatePassed: true,
        processExitCode: 0,
        elapsedSeconds: 6,
        decodedResponse: 'CLIENT_ISOLATION_OK',
        decodedResponseBytes: 19,
        agentMessages: 1,
        toolCalls: 0,
        mcpToolCalls: 0,
        traceEvents: 4,
        undisclosedEndpointSignals: 0,
        retrySignals: 0,
        auditorValid: true,
        auditorViolations: 0,
      },
      workspaceIntegrityAfterAttempt: {
        unchanged: '7/7',
        candidateHashesUnchanged: '7/7',
        agentCursorTreesUnchanged: '14/14',
        repeatPairsUnchanged: '2/2',
      },
    });
    expect(candidate05Plan.stage1Result).toBe(
      'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-05-stage-1-results.json',
    );
    expect(candidate05Plan.stage1Decision).toMatchObject({
      status: 'pass',
      mandatoryRuns: '2/2',
      independentFindingRecall: '6/6',
      findingIdCoverage: '6/6',
      findingIdOrder: '2/2 outputs',
      unchangedRepeatIdentityStability: '3/3',
      structuralValidatorPass: '2/2',
      executionPass: '2/2',
      readOnlyIntegrityPass: '2/2',
      sourceBearingRetries: 0,
      stage2Authorized: true,
    });
    expect(candidate05Stage1Results).toMatchObject({
      status: 'stage-1-pass-stage-2-authorization-pending',
      publicSyntheticSourceTransmitted: true,
      privateSourceTransmitted: false,
      runsExecuted: 2,
      runsRetried: 0,
      mandatoryPassCount: 2,
      mandatoryFailCount: 0,
      metrics: {
        mandatoryRuns: '2/2',
        independentFindingRecall: '6/6',
        findingIdCoverage: '6/6',
        findingIdOrder: '2/2 outputs',
        unchangedRepeatIdentityStability: '3/3',
        severityAccuracy: '6/6',
        structuralValidatorPass: '2/2',
        executionPass: '2/2',
        readOnlyIntegrityPass: '2/2',
      },
      integrity: {
        allFrozenWorkspacesUnchangedAfterStage1: '7/7',
        applicableCollectorCallsExactlyOnce: '2/2',
        equivalentGitInventoryRereads: 0,
        mcpToolCalls: 0,
        auditorViolations: 0,
        undisclosedEndpointSignals: 0,
        sourceBearingRetries: 0,
      },
      decision: 'Stage 1 Pass; Stage 2 authorization pending',
    });
    expect(candidate05Stage1Results.runs).toHaveLength(2);
    expect(candidate05Stage1Results.runs[0].conceptToId).toEqual(
      candidate05Stage1Results.runs[1].conceptToId,
    );
    expect(candidate05Plan.result).toBe(
      'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-05-results.json',
    );
    expect(candidate05Plan.stage2Decision).toMatchObject({
      status: 'complete-no-go',
      runsExecuted: '5/5',
      mandatoryRuns: '2/5',
      structuralValidatorPass: '3/5',
      executionPass: '4/5',
      readOnlyIntegrityPass: '5/5',
      sourceBearingRetries: 0,
    });
    expect(candidate05Results).toMatchObject({
      status: 'complete-no-go',
      publicSyntheticSourceTransmitted: true,
      privateSourceTransmitted: false,
      runsExecuted: 7,
      runsRetried: 0,
      mandatoryPassCount: 4,
      mandatoryFailCount: 3,
      metrics: {
        independentFindingRecall: '9/9',
        findingIdCoverage: '9/9',
        initialRepeatIdentityStability: '3/3',
        fixClosureCoverage: '6/6',
        fixIdPreservation: '6/6',
        severityAccuracy: '9/9',
        structuralValidatorPass: '5/7',
        executionPass: '6/7',
        readOnlyIntegrityPass: '7/7',
      },
      integrity: {
        workspaceStatusesUnchanged: '7/7',
        applicableCollectorCallsExactlyOnce: '6/6',
        equivalentGitInventoryRereads: 1,
        mcpToolCalls: 0,
        auditorViolations: 1,
        undisclosedEndpointSignals: 0,
        sourceBearingRetries: 0,
      },
      decision: 'No-Go',
    });
    expect(candidate05Results.runs).toHaveLength(7);
    expect(candidate05Results.runs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          caseId: 'Q-ID-002',
          structuralValidatorResult: 'Fail',
        }),
        expect.objectContaining({
          caseId: 'D-ID-001',
          structuralValidatorResult: 'Fail',
        }),
        expect.objectContaining({
          caseId: 'F-ID-001',
          runId: 'RUN-02',
          semanticResult: 'Pass',
          executionResult: 'Fail',
        }),
      ]),
    );
    expect(candidate06Plan).toMatchObject({
      candidate: 'v0.4.0-finding-identity-candidate-06',
      status: 'complete-no-go-stage-2-not-run',
      predecessor: {
        candidate: 'v0.4.0-finding-identity-candidate-05',
        decision: 'No-Go',
        mandatoryPassCount: 4,
        mandatoryRunCount: 7,
        failedRuns: [
          'Q-ID-002 RUN-01',
          'D-ID-001 RUN-01',
          'F-ID-001 RUN-02',
        ],
      },
      sourcePolicy: {
        visibility: 'public-synthetic-only',
        privateSourceAllowed: false,
        sourceTransmitted: true,
      },
      instructionBudgetRelativeToCandidate05: {
        skillMdNetWords: '0',
        quickAndDeepReferenceNetWords: '<=20',
        fixReferenceNetWords: '<=30',
        frontmatterNetWords: '0',
        newVisibleOutputFields: 0,
        validatorInstructionsLoadedAtRuntime: false,
      },
    });
    expect(candidate06Plan.prospectiveWindow).toMatchObject({
      sourceBearingRuns: 7,
      freshWorkspacesRequired: true,
      freshSourceFreeProbeRequired: true,
      freshSourceBearingAuthorizationRequired: true,
      carryForwardSourceBearingResults: false,
      failedRunRetryPolicy: 'no-in-place-retry',
      stage1: {
        runOrder: [
          'Q-ID-002 RUN-01',
          'D-ID-001 RUN-01',
          'F-ID-001 RUN-01',
          'F-ID-001 RUN-02',
        ],
        continueOnlyIf: {
          mandatoryRuns: '4/4',
          structuralValidatorPass: '4/4',
          executionPass: '4/4',
          fixClosureCoverage: '6/6',
          fixIdPreservation: '6/6',
        },
      },
      stage2: {
        runOrder: ['Q-ID-001 RUN-01', 'Q-ID-001 RUN-02', 'K-ID-001 RUN-01'],
      },
    });
    expect(candidate06Plan.nonGoals).toContain(
      'No weakening of the collector equivalent-reread gate.',
    );
    expect(candidate06Plan.implementation).toMatchObject({
      candidate06EnglishWords: {
        skillMd: 3725,
        quickReference: 650,
        deepReference: 703,
        fixReference: 519,
      },
      netEnglishWords: {
        skillMd: 0,
        quickAndDeepReferences: 14,
        fixReference: 25,
        frontmatter: 0,
      },
      exactFrozenReplacementsApplied: '3/3',
      visibleOutputTemplateFieldsAdded: 0,
      evaluatorChanged: false,
      frontmatterUnchanged: true,
    });
    expect(candidate06Plan.staticValidation).toMatchObject({
      vitest: '9/9 files; 104/104 tests',
      repositoryValidator: 'pass',
      officialSkillValidator: 'pass',
      nodeSyntax: '3/3 scripts',
      runtimeInstructionHashes: '4/4 recorded and matched',
      exactFrozenReplacements: '3/3',
      instructionBudget: 'pass',
      sensitiveValueScan: 'pass',
      gitDiffCheck: 'pass',
    });
    expect(candidate06Plan.preparedWorkspaces).toHaveLength(7);
    expect(
      candidate06Plan.preparedWorkspaces.every(
        (workspace: { actualTestExitCode: number; expectedTestExitCode: number }) =>
          workspace.actualTestExitCode === workspace.expectedTestExitCode,
      ),
    ).toBe(true);
    expect(candidate06Plan.repeatAssertions).toHaveLength(2);
    expect(candidate06Plan.workspaceIntegrity).toMatchObject({
      expectedTestResultsMatched: '7/7',
      candidateSkillHashesMatched: '7/7',
      agentCursorSkillCopiesMatched: '7/7',
      agentCursorSkillTreesMatched: '14/14',
      quickDeepFixReferenceHashesMatched: '21/21',
      cursorAdapterCopiesMatched: '7/7',
      previousFindingsHashesMatched: '2/2',
      evaluatorValidatorCopiedIntoRuntime: false,
    });
    expect(Object.keys(candidate06Plan.oracleHashes)).toHaveLength(5);
    for (const repeat of candidate06Plan.repeatAssertions) {
      const pair = candidate06Plan.preparedWorkspaces.filter(
        ({ caseId }: { caseId: string }) => caseId === repeat.caseId,
      );
      expect(pair).toHaveLength(2);
      expect(pair[0].head).toBe(pair[1].head);
      expect(pair[0].treeSha256).toBe(pair[1].treeSha256);
    }
    expect(candidate06Plan.clientWindow).toMatchObject({
      client: 'Codex CLI 0.146.0',
      provider: 'Joymeet',
      model: 'gpt-5.5',
      sandbox: 'read-only',
      ephemeral: true,
      ignoreRules: true,
      httpRetries: 0,
      sseRetries: 0,
      sourceFreeProbe: {
        workingDirectory: '/private/tmp',
        skipGitRepoCheck: true,
        expectedDecodedResponse: 'CLIENT_ISOLATION_OK',
        expectedAgentMessages: 1,
        expectedToolCalls: 0,
        expectedMcpCalls: 0,
        expectedUndisclosedEndpoints: 0,
        expectedRetrySignals: 0,
        sourceTransmitted: false,
        sourceBearingAuthorized: false,
        retryPolicy: 'no retry',
      },
    });
    expect(candidate06Plan.clientWindow.mcpServersExplicitlyDisabled).toHaveLength(9);
    expect(candidate06Plan.sourceFreeProbeResult).toBe(
      'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-06-probe-result.json',
    );
    expect(candidate06Plan.sourceFreeProbeDecision).toMatchObject({
      status: 'pass',
      mandatoryGatePassed: true,
      decodedResponse: 'CLIENT_ISOLATION_OK',
      agentMessages: 1,
      toolCalls: 0,
      mcpToolCalls: 0,
      undisclosedEndpointSignals: 0,
      retrySignals: 0,
      workspaceIntegrity: '7/7',
      sourceBearingStage1Authorized: false,
    });
    expect(candidate06ProbeResult).toMatchObject({
      status: 'pass-source-bearing-stage-1-authorization-pending',
      sourceTransmitted: false,
      privateSourceTransmitted: false,
      result: {
        mandatoryGatePassed: true,
        processExitCode: 0,
        elapsedSeconds: 6,
        decodedResponse: 'CLIENT_ISOLATION_OK',
        decodedResponseBytes: 19,
        agentMessages: 1,
        toolCalls: 0,
        commandExecutions: 0,
        mcpToolCalls: 0,
        traceEvents: 4,
        undisclosedEndpointSignals: 0,
        retrySignals: 0,
        auditorValid: true,
        auditorViolations: 0,
      },
      workspaceIntegrityAfterProbe: {
        unchanged: '7/7',
        candidateHashesUnchanged: '7/7',
        agentCursorTreesUnchanged: '14/14',
        repeatPairsUnchanged: '2/2',
      },
    });
    expect(candidate06Plan.stage1Authorization).toMatchObject({
      status: 'complete',
      sourceScope: 'four-public-synthetic-workspaces',
      publicSyntheticSourceTransmitted: true,
      privateSourceTransmitted: false,
    });
    expect(candidate06Plan.stage1Execution).toMatchObject({
      status: 'complete-no-go-stage-2-not-run',
      runsExecuted: 4,
      runsRetried: 0,
      mandatoryPassCount: 3,
      mandatoryFailCount: 1,
      decision: 'No-Go; Stage 2 not run',
    });
    expect(candidate06Plan.stage1Execution.completedRuns).toHaveLength(4);
    expect(candidate06Stage1Results).toMatchObject({
      status: 'complete-no-go-stage-2-not-run',
      publicSyntheticSourceTransmitted: true,
      privateSourceTransmitted: false,
      runsExecuted: 4,
      runsRetried: 0,
      mandatoryPassCount: 3,
      mandatoryFailCount: 1,
      stage2RunsExecuted: 0,
      metrics: {
        mandatoryRuns: '3/4',
        independentFindingRecall: '3/3',
        findingIdCoverage: '9/9',
        fixClosureCoverage: '6/6',
        fixIdPreservation: '6/6',
        fixRepeatStability: '3/3',
        severityAccuracy: '9/9',
        structuralValidatorPass: '3/4',
        executionPass: '4/4',
        readOnlyIntegrityPass: '4/4',
      },
      integrity: {
        allFrozenWorkspacesUnchangedAfterStage1: '7/7',
        applicableCollectorCallsExactlyOnce: '3/3',
        equivalentGitInventoryRereads: 0,
        mcpToolCalls: 0,
        auditorViolations: 0,
        undisclosedEndpointSignals: 0,
        sourceBearingRetries: 0,
      },
      decision: 'No-Go; Stage 2 not run',
    });
    expect(candidate06Stage1Results.runs).toHaveLength(4);
    expect(candidate07Plan).toMatchObject({
      candidate: 'v0.4.0-finding-identity-candidate-07',
      status: 'complete-no-go',
      predecessor: {
        candidate: 'v0.4.0-finding-identity-candidate-06',
        decision: 'No-Go; Stage 2 not run',
        mandatoryPassCount: 3,
        mandatoryRunCount: 4,
        failedRuns: ['D-ID-001 RUN-01'],
      },
      sourcePolicy: {
        visibility: 'public-synthetic-only',
        privateSourceAllowed: false,
        sourceTransmitted: true,
        externalRequestAuthorized: true,
        sourceBearingExternalRequestAuthorized: true,
        sourceBearingAuthorizedScope: 'seven-public-synthetic-workspaces',
        privateSourceTransmitted: false,
        evaluatorOracleTransmitted: false,
      },
      instructionBudgetRelativeToCandidate06: {
        skillMdNetWords: '<=20',
        quickAndDeepReferenceNetWords: '<=10',
        fixReferenceNetWords: '0',
        frontmatterNetWords: '0',
        newVisibleOutputFields: 0,
        validatorInstructionsLoadedAtRuntime: false,
      },
      implementation: {
        candidate07EnglishWords: {
          skillMd: 3745,
          quickReference: 643,
          deepReference: 719,
          fixReference: 519,
        },
        netEnglishWords: {
          skillMd: 20,
          quickAndDeepReferences: 9,
          fixReference: 0,
          frontmatter: 0,
        },
        visibleOutputTemplateFieldsAdded: 0,
        evaluatorChanged: false,
        fixReferenceUnchanged: true,
        frontmatterUnchanged: true,
      },
      staticValidation: {
        status: 'pass',
        targetedVitest: '2/2 files; 44/44 tests',
        fullVitest: '9/9 files; 104/104 tests',
        repositoryValidator: 'pass',
        officialSkillValidator: 'pass',
        nodeSyntax: '3/3 scripts',
        jsonParse: '38/38 files',
        runtimeInstructionHashes: '4/4 recorded and matched',
        instructionBudget: 'pass',
        sensitiveValueScan: 'pass',
        gitDiffCheck: 'pass',
      },
      workspaceIntegrity: {
        expectedTestResultsMatched: '7/7',
        candidateSkillHashesMatched: '7/7',
        agentCursorSkillCopiesMatched: '7/7',
        agentCursorSkillTreesMatched: '14/14',
        quickDeepFixReferenceHashesMatched: '21/21',
        cursorAdapterCopiesMatched: '7/7',
        previousFindingsHashesMatched: '2/2',
        evaluatorValidatorCopiedIntoRuntime: false,
      },
    });
    expect(candidate07Plan.preparedWorkspaces).toHaveLength(7);
    expect(
      candidate07Plan.preparedWorkspaces.every(
        (workspace: { actualTestExitCode: number; expectedTestExitCode: number }) =>
          workspace.actualTestExitCode === workspace.expectedTestExitCode,
      ),
    ).toBe(true);
    expect(candidate07Plan.repeatAssertions).toEqual([
      expect.objectContaining({
        caseId: 'Q-ID-001',
        runs: ['RUN-01', 'RUN-02'],
        expectedHead: '5aa3cc1e7f1179fa589893cf015794f2ba220483',
        expectedTreeSha256: '3f915820df3cb768b51a33b56edb84d08497727cd6478989faacabb73d8bf2b2',
      }),
      expect.objectContaining({
        caseId: 'F-ID-001',
        runs: ['RUN-01', 'RUN-02'],
        expectedHead: 'c942357e2209f3322f5723ba208e36aa49b9e306',
        expectedTreeSha256: '5a4af49df98f780083c5f9ed1338e899dee1e3779f394786dfe89b10a8d80efd',
      }),
    ]);
    expect(candidate07Plan.prospectiveWindow.stage1.runOrder).toEqual([
      'D-ID-001 RUN-01',
    ]);
    expect(candidate07Plan.prospectiveWindow.stage2.runOrder).toHaveLength(6);
    expect(candidate07Plan.sourceFreeProbeDecision).toMatchObject({
      status: 'pass',
      mandatoryGatePassed: true,
      responseGatePassed: true,
      traceGatePassed: true,
      workspaceIntegrity: '7/7',
      processExitEvidenceGatePassed: true,
      processExitCode: 0,
      sourceBearingStage1Authorized: false,
    });
    expect(candidate07Plan.replacementProbe).toMatchObject({
      status: 'complete-pass',
      attemptId: 'source-free-probe-attempt-02',
      carryForwardAttempt01AsPass: false,
      providerRequestParametersUnchanged: true,
      sourceBearingAuthorized: false,
    });
    expect(candidate07ProbeAttempt01).toMatchObject({
      status: 'inconclusive-local-wrapper-exit-evidence-missing',
      sourceTransmitted: false,
      privateSourceTransmitted: false,
      result: {
        mandatoryGatePassed: false,
        responseGatePassed: true,
        traceGatePassed: true,
        isolationSignalGatePassed: true,
        workspaceIntegrityGatePassed: true,
        processExitEvidenceGatePassed: false,
        codexProcessExitCode: null,
        codexProcessExitCodeObserved: false,
        wrapperExitCode: 1,
        decodedResponse: 'CLIENT_ISOLATION_OK',
        decodedResponseBytes: 19,
        agentMessages: 1,
        toolCalls: 0,
        mcpToolCalls: 0,
        auditorValid: true,
        auditorViolations: 0,
      },
      workspaceIntegrityAfterAttempt: {
        unchanged: '7/7',
        candidateHashesUnchanged: '7/7',
        agentCursorTreesUnchanged: '14/14',
        repeatPairsUnchanged: '2/2',
      },
      retryPolicy: {
        inPlaceRetryPerformed: false,
        replacementAttemptAuthorized: false,
      },
    });
    expect(candidate07ProbeAttempt02).toMatchObject({
      status: 'pass-source-bearing-stage-1-authorization-pending',
      sourceTransmitted: false,
      privateSourceTransmitted: false,
      replacementContract: {
        predecessorAttempt: 'source-free-probe-attempt-01',
        providerRequestParametersUnchanged: true,
        carryForwardAttempt01AsPass: false,
      },
      result: {
        mandatoryGatePassed: true,
        processExitCode: 0,
        elapsedSeconds: 5,
        decodedResponse: 'CLIENT_ISOLATION_OK',
        decodedResponseBytes: 19,
        agentMessages: 1,
        toolCalls: 0,
        mcpToolCalls: 0,
        auditorValid: true,
        auditorViolations: 0,
      },
      workspaceIntegrityAfterAttempt: {
        unchanged: '7/7',
        candidateHashesUnchanged: '7/7',
        agentCursorTreesUnchanged: '14/14',
        repeatPairsUnchanged: '2/2',
      },
    });
    expect(candidate07Plan.stage1Authorization).toMatchObject({
      status: 'complete',
      sourceScope: 'one-public-synthetic-stage-1-workspace',
      runOrder: ['D-ID-001 RUN-01'],
      publicSyntheticSourceTransmitted: true,
      privateSourceTransmitted: false,
      evaluatorOracleTransmitted: false,
    });
    expect(candidate07Plan.stage1Execution).toMatchObject({
      status: 'complete-pass',
      runsExecuted: 1,
      runsRetried: 0,
      mandatoryPassCount: 1,
      mandatoryFailCount: 0,
      stage2RunsExecuted: 0,
      metrics: {
        mandatoryRuns: '1/1',
        independentFindingRecall: '1/1',
        findingIdCoverage: '1/1',
        severityAccuracy: '1/1',
        repeatedFindingIdMergeKeyCoverage: '2/2',
        structuralValidatorPass: '1/1',
        executionPass: '1/1',
        readOnlyIntegrityPass: '1/1',
        clientIsolationPass: '1/1',
      },
    });
    expect(candidate07Stage1Results).toMatchObject({
      status: 'stage-1-pass-stage-2-authorization-pending',
      publicSyntheticSourceTransmitted: true,
      privateSourceTransmitted: false,
      evaluatorOracleTransmitted: false,
      runsExecuted: 1,
      runsRetried: 0,
      mandatoryPassCount: 1,
      mandatoryFailCount: 0,
      metrics: {
        mandatoryRuns: '1/1',
        independentFindingRecall: '1/1',
        findingIdCoverage: '1/1',
        severityAccuracy: '1/1',
        repeatedFindingIdMergeKeyCoverage: '2/2',
        structuralValidatorPass: '1/1',
        executionPass: '1/1',
        readOnlyIntegrityPass: '1/1',
        clientIsolationPass: '1/1',
        falsePositiveCount: 0,
      },
      integrity: {
        stage1WorkspaceStatusUnchanged: '1/1',
        allFrozenWorkspacesUnchangedAfterStage1: '7/7',
        mcpToolCalls: 0,
        auditorViolations: 0,
        undisclosedEndpointSignals: 0,
        sourceBearingRetries: 0,
      },
    });
    expect(candidate07Stage1Results.runs).toEqual([
      expect.objectContaining({
        caseId: 'D-ID-001',
        runId: 'RUN-01',
        mandatoryResult: 'Pass',
        semanticResult: 'Pass',
        structuralValidatorResult: 'Pass',
        actualFindingIds: ['F-001'],
        actualSeverity: 'Blocking',
        actualDesignDecision: 'Simplify',
        repeatedFindingIdMergeKey: 'session-cache-owner',
        repeatedFindingIdMergeKeyCoverage: '2/2',
        recommendation: '修改后可以进入下一步',
        expectedFixtureTestExitCode: 1,
        actualFixtureTestExitCode: 1,
        processExitCode: 0,
        retrySignals: 0,
      }),
    ]);
    expect(candidate07Plan.stage2Authorization).toMatchObject({
      status: 'complete',
      sourceScope: 'six-public-synthetic-stage-2-workspaces',
      publicSyntheticSourceTransmitted: true,
      privateSourceTransmitted: false,
      evaluatorOracleTransmitted: false,
    });
    expect(candidate07Plan.stage2Authorization.runOrder).toEqual([
      'Q-ID-002 RUN-01',
      'F-ID-001 RUN-01',
      'F-ID-001 RUN-02',
      'Q-ID-001 RUN-01',
      'Q-ID-001 RUN-02',
      'K-ID-001 RUN-01',
    ]);
    expect(candidate07Plan.stage2Execution).toMatchObject({
      status: 'complete-no-go',
      runsExecuted: 6,
      runsRetried: 0,
      mandatoryPassCount: 5,
      mandatoryFailCount: 1,
      failedRuns: ['Q-ID-001 RUN-02'],
      structuralValidatorPass: '6/6',
      executionPass: '6/6',
      readOnlyIntegrityPass: '6/6',
    });
    expect(candidate07Results).toMatchObject({
      status: 'complete-no-go',
      sourceScope: 'seven-public-synthetic-workspaces',
      publicSyntheticSourceTransmitted: true,
      privateSourceTransmitted: false,
      evaluatorOracleTransmitted: false,
      runsExecuted: 7,
      runsRetried: 0,
      mandatoryPassCount: 6,
      mandatoryFailCount: 1,
      metrics: {
        mandatoryRuns: '6/7',
        independentFindingRecall: '8/9',
        initialRepeatIdentityStability: '2/3',
        fixClosureCoverage: '6/6',
        fixIdPreservation: '6/6',
        severityAccuracy: '9/9',
        repeatedFindingIdMergeKeyCoverage: '2/2',
        structuralValidatorPass: '7/7',
        executionPass: '7/7',
        readOnlyIntegrityPass: '7/7',
        clientIsolationPass: '7/7',
      },
      integrity: {
        workspaceStatusesUnchanged: '7/7',
        workspaceTreeHashesUnchanged: '7/7',
        applicableCollectorCallsExactlyOnce: '6/6',
        equivalentGitInventoryRereads: 0,
        mcpToolCalls: 0,
        auditorViolations: 0,
        undisclosedEndpointSignals: 0,
        sourceBearingRetries: 0,
      },
      decision: 'No-Go',
    });
    expect(candidate07Results.runs).toHaveLength(7);
    expect(
      candidate07Results.runs.find(
        (run: { caseId: string; runId: string }) =>
          run.caseId === 'Q-ID-001' && run.runId === 'RUN-02',
      ),
    ).toMatchObject({
      mandatoryResult: 'Fail',
      semanticResult: 'Fail',
      executionResult: 'Pass',
      structuralValidatorResult: 'Pass',
      independentFindingRecall: '2/3',
      conceptToId: {
        'referenced-untracked-file': 'F-001',
        'ignored-base-url-contract': 'F-002',
        'removed-slash-normalization': 'F-002',
      },
    });
    expect(candidate07Plan.nonGoals).toContain(
      'No severity-rule change; Candidate 06 Q-ID-002 already satisfies the frozen oracle.',
    );
    expect(candidate08Plan).toMatchObject({
      candidate: 'v0.4.0-finding-identity-candidate-08',
      status: 'complete-go-after-tooling-replay',
      toolingReplayResult:
        'evaluation/runtime-windows/v0.4.0-finding-identity-candidate-08-tooling-replay.json',
      predecessor: {
        candidate: 'v0.4.0-finding-identity-candidate-07',
        decision: 'No-Go',
        mandatoryPassCount: 6,
        mandatoryRunCount: 7,
        failedRuns: ['Q-ID-001 RUN-02'],
      },
      sourcePolicy: {
        visibility: 'public-synthetic-only',
        privateSourceAllowed: false,
        sourceTransmitted: true,
        externalRequestAuthorized: true,
        sourceFreeProbeAuthorized: true,
        sourceFreeProbeCompleted: true,
        stage1SourceBearingAuthorized: true,
        stage1SourceBearingCompleted: true,
        stage2SourceBearingAuthorized: true,
        stage2SourceBearingCompleted: true,
        publicSyntheticSourceTransmitted: true,
      },
      instructionBudgetRelativeToCandidate07: {
        skillMdNetWords: '<=25',
        quickAndDeepReferenceNetWords: '0',
        fixReferenceNetWords: '0',
        frontmatterNetWords: '0',
        newVisibleOutputFields: 0,
        evaluatorInstructionsLoadedAtRuntime: false,
      },
      implementation: {
        candidate08EnglishWords: {
          skillMd: 3766,
          quickReference: 643,
          deepReference: 719,
          fixReference: 519,
        },
        netEnglishWords: {
          skillMd: 21,
          quickAndDeepReferences: 0,
          fixReference: 0,
          frontmatter: 0,
        },
        visibleOutputTemplateFieldsAdded: 0,
        evaluatorChanged: false,
        modeReferencesUnchanged: true,
        frontmatterUnchanged: true,
      },
      staticValidation: {
        status: 'pass',
        targetedVitest: '2/2 files; 44/44 tests',
        fullVitest: '9/9 files; 104/104 tests',
        repositoryValidator: 'pass',
        officialSkillValidator: 'pass',
        nodeSyntax: '3/3 scripts',
        jsonParse: '39/39 files',
        runtimeInstructionHashes: '4/4 recorded and matched',
        instructionBudget: 'pass',
        sensitiveValueScan: 'pass',
        gitDiffCheck: 'pass',
      },
      workspaceIntegrity: {
        status: 'pass',
        expectedTestResultsMatched: '7/7',
        candidateSkillHashesMatched: '7/7',
        agentCursorSkillTreesMatched: '14/14',
        quickDeepFixReferenceHashesMatched: '21/21',
        cursorAdapterCopiesMatched: '7/7',
        previousFindingsHashesMatched: '2/2',
        evaluatorValidatorCopiedIntoRuntime: false,
      },
      sourceFreeProbe: {
        status: 'pass-source-bearing-stage-1-authorization-pending',
        sourceTransmitted: false,
        sourceBearingAuthorized: false,
        processExitCode: 0,
        elapsedSeconds: 19,
        decodedResponse: 'CLIENT_ISOLATION_OK',
        decodedResponseBytes: 19,
        agentMessages: 1,
        turnCompletedEvents: 1,
        toolCalls: 0,
        mcpToolCalls: 0,
        traceEvents: 4,
        undisclosedEndpointSignals: 0,
        retrySignals: 0,
        auditorValid: true,
        workspacesUnchanged: '7/7',
      },
    });
    expect(candidate08ProbeResult).toMatchObject({
      candidate: 'v0.4.0-finding-identity-candidate-08',
      status: 'pass-source-bearing-stage-1-authorization-pending',
      sourceTransmitted: false,
      privateSourceTransmitted: false,
      result: {
        mandatoryGatePassed: true,
        processExitCode: 0,
        elapsedSeconds: 19,
        decodedResponse: 'CLIENT_ISOLATION_OK',
        decodedResponseBytes: 19,
        agentMessages: 1,
        turnCompletedEvents: 1,
        toolCalls: 0,
        commandExecutions: 0,
        mcpToolCalls: 0,
        traceEvents: 4,
        undisclosedEndpointSignals: 0,
        pluginSignals: 0,
        marketplaceSignals: 0,
        retrySignals: 0,
        auditorValid: true,
        auditorViolations: 0,
      },
      workspaceIntegrityAfterProbe: {
        unchanged: '7/7',
        candidateHashesUnchanged: '7/7',
        agentCursorTreesUnchanged: '14/14',
        repeatPairsUnchanged: '2/2',
      },
    });
    expect(candidate08ProbeResult.artifactHashes.workspaceFreezeBeforeSha256).toBe(
      candidate08ProbeResult.artifactHashes.workspaceFreezeAfterSha256,
    );
    expect(candidate08Stage1Results).toMatchObject({
      status: 'stage-1-pass-stage-2-authorization-pending',
      sourceScope: 'two-byte-identical-public-synthetic-q-id-001-workspaces',
      publicSyntheticSourceTransmitted: true,
      privateSourceTransmitted: false,
      evaluatorOracleTransmitted: false,
      runsExecuted: 2,
      runsRetried: 0,
      mandatoryPassCount: 2,
      mandatoryFailCount: 0,
      metrics: {
        mandatoryRuns: '2/2',
        independentFindingRecall: '6/6',
        initialRepeatIdentityStability: '3/3',
        severityAccuracy: '6/6',
        structuralValidatorPass: '2/2',
        executionPass: '2/2',
        readOnlyIntegrityPass: '2/2',
        clientIsolationPass: '2/2',
      },
      integrity: {
        workspaceStatusesUnchanged: '2/2',
        allFrozenWorkspacesUnchangedAfterStage1: '7/7',
        applicableCollectorCallsExactlyOnce: '2/2',
        equivalentGitInventoryRereads: 0,
        mcpToolCalls: 0,
        auditorViolations: 0,
        undisclosedEndpointSignals: 0,
        sourceBearingRetries: 0,
      },
      decision: 'Stage 1 Pass; Stage 2 authorization pending',
    });
    expect(candidate08Stage1Results.runs).toEqual([
      expect.objectContaining({
        caseId: 'Q-ID-001',
        runId: 'RUN-01',
        mandatoryResult: 'Pass',
        independentFindingRecall: '3/3',
        actualFindingIds: ['F-001', 'F-002', 'F-003'],
        conceptToId: {
          'referenced-untracked-file': 'F-001',
          'ignored-base-url-contract': 'F-002',
          'removed-slash-normalization': 'F-003',
        },
        processExitCode: 0,
      }),
      expect.objectContaining({
        caseId: 'Q-ID-001',
        runId: 'RUN-02',
        mandatoryResult: 'Pass',
        independentFindingRecall: '3/3',
        actualFindingIds: ['F-001', 'F-002', 'F-003'],
        conceptToId: {
          'referenced-untracked-file': 'F-001',
          'ignored-base-url-contract': 'F-002',
          'removed-slash-normalization': 'F-003',
        },
        processExitCode: 0,
      }),
    ]);
    expect(candidate08Results).toMatchObject({
      status: 'complete-go-after-tooling-replay',
      sourceScope: 'seven-public-synthetic-workspaces',
      publicSyntheticSourceTransmitted: true,
      privateSourceTransmitted: false,
      evaluatorOracleTransmitted: false,
      runsExecuted: 7,
      runsRetried: 0,
      rawMandatoryPassCount: 6,
      rawMandatoryFailCount: 1,
      mandatoryPassCountAfterToolingReplay: 7,
      mandatoryFailCountAfterToolingReplay: 0,
      metrics: {
        rawMandatoryRuns: '6/7',
        mandatoryRunsAfterToolingReplay: '7/7',
        semanticOraclePass: '7/7',
        independentFindingRecall: '9/9',
        initialRepeatIdentityStability: '3/3',
        fixClosureCoverage: '6/6',
        fixIdPreservation: '6/6',
        severityAccuracy: '9/9 expected findings',
        structuralValidatorPass: '7/7',
        rawExecutionPass: '6/7',
        executionPassAfterToolingReplay: '7/7',
        workspaceReadOnlyIntegrityPass: '7/7',
        rawTraceAuditorPass: '6/7',
        traceAuditorPassAfterToolingReplay: '7/7',
        falsePositiveCount: 0,
      },
      integrity: {
        workspaceStatusesUnchanged: '7/7',
        workspaceTreeHashesUnchanged: '7/7',
        applicableCollectorCallsExactlyOnce: '6/6',
        mcpToolCalls: 0,
        rawAuditorViolations: 2,
        suspectedAuditorFalsePositiveViolations: 2,
        toolingReplayAuditorViolations: 0,
        undisclosedEndpointSignals: 0,
        sourceBearingRetries: 0,
      },
      decision: 'Go',
    });
    expect(candidate08ToolingReplay).toMatchObject({
      candidate: 'v0.4.0-finding-identity-candidate-08',
      status: 'complete-pass-tooling-only',
      modelCalls: 0,
      externalNetworkRequests: 0,
      sourceTransmitted: false,
      runsRetried: 0,
      guard: {
        targetedTests: '30/30',
      },
      replayedTrace: {
        caseId: 'F-ID-001',
        runId: 'RUN-01',
        originalAuditResult:
          'Fail: two outside-workspace-read violations from relative import text inside the rg pattern',
        correctedAuditResult: 'Pass',
        violations: 0,
        collectorCalls: 1,
        workspaceStatusUnchanged: true,
      },
      promotion: {
        rawMandatoryRunsPreserved: '6/7',
        mandatoryRunsAfterToolingReplay: '7/7',
        executionPassAfterToolingReplay: '7/7',
      },
      decision: 'Go',
    });
    expect(candidate08Results.runs).toHaveLength(7);
    expect(
      candidate08Results.runs.find(
        (run: { caseId: string; runId: string }) =>
          run.caseId === 'F-ID-001' && run.runId === 'RUN-01',
      ),
    ).toMatchObject({
      mandatoryResult: 'Fail',
      semanticResult: 'Pass',
      executionResult: 'Fail',
      structuralValidatorResult: 'Pass',
      failureClassification: 'suspected-evaluator-false-positive',
      rawAuditorViolations: 2,
    });
    expect(
      candidate08Results.runs.find(
        (run: { caseId: string }) => run.caseId === 'D-ID-001',
      ),
    ).toMatchObject({
      mandatoryResult: 'Pass',
      independentFindingRecall: '1/1',
      actualFindingIds: ['F-001', 'F-002'],
      validAdditionalFindingCount: 1,
      falsePositiveCount: 0,
    });
    expect(candidate08Plan.preparedWorkspaces).toHaveLength(7);
    expect(
      candidate08Plan.preparedWorkspaces.every(
        (workspace: { actualTestExitCode: number; expectedTestExitCode: number }) =>
          workspace.actualTestExitCode === workspace.expectedTestExitCode,
      ),
    ).toBe(true);
    expect(candidate08Plan.repeatAssertions).toEqual([
      {
        caseId: 'Q-ID-001',
        runs: ['RUN-01', 'RUN-02'],
        expectedHead: '9565638c25593393108459acde4477e42c4f6a5c',
        expectedTreeSha256:
          '186ede60cd5bb3eaf5165a5a1b6393b55a059e61c8a864e2f578a04afb577934',
      },
      {
        caseId: 'F-ID-001',
        runs: ['RUN-01', 'RUN-02'],
        expectedHead: '92f6ec81973748811c7e202ed326e35ad1a077c1',
        expectedTreeSha256:
          '93b66a8d4880e78ffac4db152d1226ce9d532c564b28a39bc580bc50cac74cda',
      },
    ]);
    expect(candidate08Plan.clientWindow).toMatchObject({
      client: 'Codex CLI 0.146.0',
      provider: 'Joymeet',
      model: 'gpt-5.5',
      sandbox: 'read-only',
      httpRetries: 0,
      sseRetries: 0,
    });
    expect(candidate08Plan.clientWindow.mcpServersExplicitlyDisabled).toHaveLength(9);
    expect(candidate08Plan.prospectiveWindow.stage1.runOrder).toEqual([
      'Q-ID-001 RUN-01',
      'Q-ID-001 RUN-02',
    ]);
    expect(candidate08Plan.prospectiveWindow.stage2.runOrder).toHaveLength(5);
    expect(candidate08Plan.prospectiveWindow.carryForwardSourceBearingResults).toBe(false);
    expect(candidate08Plan.stage1Execution).toMatchObject({
      status: 'complete-pass',
      runsExecuted: 2,
      runsRetried: 0,
      mandatoryPassCount: 2,
      mandatoryFailCount: 0,
      stage2RunsExecuted: 0,
    });
    expect(candidate08Plan.stage2Execution).toMatchObject({
      status: 'complete-hold-tooling-replay-pending',
      runsExecuted: 5,
      runsRetried: 0,
      rawMandatoryPassCount: 4,
      rawMandatoryFailCount: 1,
      semanticPass: '5/5',
      structuralValidatorPass: '5/5',
      rawExecutionPass: '4/5',
      failedRuns: ['F-ID-001 RUN-01'],
      failureClassification: 'suspected-evaluator-false-positive',
    });
    expect(candidate08Plan.toolingReplay).toMatchObject({
      status: 'complete-pass-tooling-only',
      modelCalls: 0,
      externalNetworkRequests: 0,
      sourceTransmitted: false,
      runsRetried: 0,
      rawMandatoryRunsPreserved: '6/7',
      mandatoryRunsAfterToolingReplay: '7/7',
      decision: 'Go',
    });
    expect(plan).toContain('Phase 9: Candidate 05 Finalization Sequence Design Freeze');
    expect(plan).toContain('Stage 1 and Stage 2 together remain one seven-run window');
    expect(plan).toContain('this design freeze transmits no source');
    expect(plan).toContain('Candidate 05 passed `4 / 7` mandatory runs');
    expect(plan).toContain('Phase 10: Candidate 06 Ledger And Collector Wording Freeze');
    expect(plan).toContain('the freeze itself sent no source');
    expect(plan).toContain('Candidate 06 therefore stopped at `No-Go 3 / 4`');
    expect(plan).toContain('Phase 11: Candidate 07 Central Finalization And Deep Recommendation Freeze');
    expect(plan).toContain('no severity-rule change is justified');
    expect(plan).toContain('contain the exact Candidate 07 hashes');
    expect(plan).toContain('local workspace freeze sent no source');
    expect(plan).toContain('Inconclusive source-free Attempt 01');
    expect(plan).toContain('Attempt 02 may change only the local wrapper capture variable');
    expect(plan).toContain('Passed replacement precondition');
    expect(plan).toContain('Passed Stage 1');
    expect(plan).toContain('Stage 2 authorization boundary');
    expect(plan).toContain('Completed Stage 2');
    expect(plan).toContain('Candidate 07 passed `6 / 7` mandatory runs');
    expect(plan).toContain('Phase 12: Candidate 08 Counterfactual Merge Gate Freeze');
    expect(plan).toContain('tests both minimum-safe-repair counterfactuals');
    expect(plan).toContain(
      'implementation, static validation, and local workspace freeze sent no source',
    );
    expect(plan).toContain('Passed source-free precondition');
    expect(plan).toContain('Passed Stage 1: both separately authorized byte-identical');
    expect(plan).toContain('Completed Stage 2: all five separately authorized');
    expect(plan).toContain('Completed tooling-only replay');
    expect(plan).toContain('Current decision: `Go 7 / 7` after tooling replay');
    expect(publishedResults).toContain(
      'Candidate 02 `No-Go`',
    );
    expect(publishedResults).toContain('Candidate 03 implemented the frozen');
    expect(publishedResults).toContain('`8 / 9` (`88.9%`)');
    expect(publishedResults).toContain('approximately `963.4s`');
    expect(publishedResults).toContain('Candidate 03 `No-Go` at `2 / 7`');
    expect(publishedResults).toContain('Structural validator pass: `2 / 7`');
    expect(publishedResults).toContain('Zero-retry provider stream disconnected');
    expect(publishedResults).toContain('tooling-only correction now accepts standard Markdown links');
    expect(publishedResults).toContain('## Candidate 04 Complete Result');
    expect(publishedResults).toContain('`32 / 60` English words');
    expect(publishedResults).toContain('Workspace freeze: seven fresh public-synthetic workspaces');
    expect(publishedResults).toContain('Source-free precondition: one separately authorized');
    expect(publishedResults).toContain('Candidate 04 metrics: independent-finding recall `8 / 9`');
    expect(publishedResults).toContain('Candidate 04 remains `No-Go`');
    expect(publishedResults).toContain('## Candidate 05 Complete Result');
    expect(publishedResults).toContain('Promotion result: `4 / 7`');
    expect(publishedResults).toContain('structural validation `5 / 7`');
    expect(publishedResults).toContain('## Candidate 06 Stage 1 Result');
    expect(publishedResults).toContain('Stage 1 result: `3 / 4`');
    expect(publishedResults).toContain('## Candidate 07 Complete Result');
    expect(publishedResults).toContain('complete source-free precondition is `Inconclusive`');
    expect(publishedResults).toContain('Separately authorized Attempt 02 passed');
    expect(publishedResults).toContain('Separately authorized Stage 1 passed `1 / 1`');
    expect(publishedResults).toContain('Candidate 07 complete result is `No-Go 6 / 7`');
    expect(publishedResults).toContain('## Candidate 08 Current Result');
    expect(publishedResults).toContain('exact 19-byte `CLIENT_ISOLATION_OK`');
    expect(publishedResults).toContain('Stage 1 therefore passed `2 / 2` mandatory runs');
    expect(publishedResults).toContain('Raw mandatory promotion remains recorded as `6 / 7`');
    expect(publishedResults).toContain('Candidate 08 is therefore `Go 7 / 7`');
  });

  test('publishes v0.1.0 runtime results without overstating Claude coverage', () => {
    const results = readText('docs/evaluation-results/v0.1.0.md');

    expect(results).toContain('Expected material findings detected: `4/4`');
    expect(results).toContain('Read-only violations: `0/2`');
    expect(results).toContain('Claude Code 2.1.206');
    expect(results).toContain('`Cannot Verify`');
    expect(results).toContain('does not provide a general precision or false-positive score');
  });

  test('publishes a v0.1.1 delta evaluation without claiming a new model run', () => {
    const results = readText('docs/evaluation-results/v0.1.1.md');

    expect(results).toContain('v0.1.1 is a patch release');
    expect(results).toContain('a66e26e60e27f643f35b402c6660038c7070e759');
    expect(results).toContain('No new model-based Quick, Deep, or Fix Review run is claimed');
    expect(results).toContain('Claude Code 2.1.206');
    expect(results).toContain('`Cannot Verify`');
    expect(results).toContain('`28/28` tests');
    expect(results).toContain('Simulated Codex, Claude Code, and Cursor installs');
    expect(results).not.toContain('Pending during release preparation');
  });

  test('publishes v0.2.0 runtime and oracle evidence without overstating coverage', () => {
    const results = readText('docs/evaluation-results/v0.2.0.md');

    expect(results).toContain('# v0.2.0 Evaluation Results');
    expect(results).toContain('Release: `v0.2.0`');
    expect(results).toContain('`41/41` tests');
    expect(results).toContain('Codex Quick Review smoke');
    expect(results).toContain('Codex post-hardening Improve-only Quick Review');
    expect(results).toContain('| Cursor | Runtime verified |');
    expect(results).toContain('| Claude Code | `Cannot Verify` |');
    expect(results).toContain('`10/10` Quick decisions and `10/10` Deep decisions');
    expect(results).toContain('created an ignored `reports/README.md`');
    expect(results).toContain('Playwright was not run');
    expect(results).toContain('Cursor CLI `2026.01.23-916f423`');
    expect(results).toContain('optimization did not affect submission');
    expect(results).toContain('post-hardening final Deep Review passed against the committed release target');
    expect(results).toContain('## Release Decision');
    expect(results).toContain('Claude Code remains explicitly `Cannot Verify`');
  });

  test('publishes v0.2.1 fixture evidence without overstating client coverage', () => {
    const results = readText('docs/evaluation-results/v0.2.1.md');

    expect(results).toContain('# v0.2.1 Evaluation Results');
    expect(results).toContain('Release: [`v0.2.1`]');
    expect(results).toContain('6 files and 47 tests passed');
    expect(results).toContain('Quick, first run');
    expect(results).toContain('Quick, repeat run');
    expect(results).toContain('design decision `Simplify`');
    expect(results).toContain('3/3 previous findings `Resolved`');
    expect(results).toContain('Cursor Deep and Fix were not rerun');
    expect(results).toContain('user-level Memory was automatically loaded');
    expect(results).toContain('Claude Code remains `Cannot Verify`');
    expect(results).not.toContain('runtime acceptance for this candidate');
  });

  test('publishes v0.2.2 post-release smoke evidence with explicit boundaries', () => {
    const results = readText('docs/evaluation-results/v0.2.2-post-release.md');

    expect(results).toContain('# v0.2.2 Post-release Smoke Results');
    expect(results).toContain('Release commit: `f477d3dd5425b0adc9cc74d3bf7bf2ac793c16ab`');
    expect(results).toContain('7 files and 51 tests passed');
    expect(results).toContain('3/3 findings with accepted severity');
    expect(results).toContain('119 events and 15 tool calls');
    expect(results).toContain('zero violations');
    expect(results).toContain('user-level Memory and plugin context');
    expect(results).toContain('not a clean fixture-isolation or Skill-only token benchmark');
    expect(results).toContain('Claude Code remains `Cannot Verify`');
    expect(results).toContain('Playwright was skipped');
  });

  test('publishes v0.3.0 post-release failures without promoting partial runs', () => {
    const results = readText('docs/evaluation-results/v0.3.0-post-release.md');

    expect(results).toContain('# v0.3.0 Post-release Smoke Results');
    expect(results).toContain('Release commit: `b04caf58f435e4074824f830617facc895dbf154`');
    expect(results).toContain('`8 / 8` files and `80 / 80` tests passed');
    expect(results).toContain('Codex CLI 0.146.0');
    expect(results).toContain('`2 / 3`; the ignored-parameter risk');
    expect(results).toContain('one collector call, zero equivalent Git rereads, zero MCP');
    expect(results).toContain('exact CLI version not captured in trace');
    expect(results).toContain('Exact `CLIENT_ISOLATION_OK`');
    expect(results).toContain('`createPlanToolCall` is a write tool');
    expect(results).toContain('equivalent Git inventory rereads');
    expect(results).toContain('Cursor remains `Cannot Verify`');
    expect(results).toContain('No failed run was retried in place or reclassified');
    expect(results).not.toContain('| Runtime pass |');
    expect(results).not.toContain('13011235000@163.com');
  });

  test('publishes the exact v0.3.0 release window without promoting synthetic evidence', () => {
    const results = readText('docs/evaluation-results/v0.3.0.md');

    expect(results).toContain('# v0.3.0 Evaluation Results');
    expect(results).toContain('Release: `v0.3.0`');
    expect(results).toContain('Release decision: `Go`');
    expect(results).toContain(
      '5665c80e426637221627f21e58c955a146865bf08d8cf64a8b88b03213e01296',
    );
    expect(results).toContain('`2 / 3 = 66.7%`');
    expect(results).toContain('`3 / 4 = 75%`');
    expect(results).toContain('### Current-candidate Deep Review');
    expect(results).toContain('`14 / 14 = 100%`');
    expect(results).toContain('`16 / 16 = 100%`');
    expect(results).toContain('Distinct exact-candidate datasets | `3` | `3` | Pass');
    expect(results).toContain('`42 / 42` commands, zero MCP');
    expect(results).toContain('`40 / 40` commands, zero MCP');
    expect(results).toContain('Public React/JavaScript package-entry compatibility change');
    expect(results).toContain('`28 / 28` commands and `7 / 7` allowlisted browser MCP calls');
    expect(results).toContain('Sanitized Vue/TypeScript response-shape mismatch');
    expect(results).toContain('`40 / 40` commands, zero MCP, client isolation Pass');
    expect(results).toContain('### Current-candidate Quick Review');
    expect(results).toContain('`14 / 14` commands, zero MCP');
    expect(results).toContain('`22 / 22` commands, zero MCP');
    expect(results).toContain('`18 / 18` commands, zero MCP');
    expect(results).toContain('`27 / 27` commands, zero MCP');
    expect(results).toContain('`15 / 15` commands, zero MCP');
    expect(results).toContain('`1 / 1 = 100%`');
    expect(results).toContain('Real-project no-finding coverage | one | one | Pass');
    expect(results).toContain('complete-uncommitted collector exactly once');
    expect(results).toContain('one unchanged repeat');
    expect(results).toContain('Current-candidate Quick acceptance is complete');
    expect(results).toContain('Synthetic evidence is explicitly labeled');
    expect(results).toContain('38 documented runs');
    expect(results).toContain('34 per-run raw outputs');
    expect(results).toContain('Fifteen sanitized or public real-project runs used this exact candidate');
    expect(results).toContain('### Current-candidate Fix Review');
    expect(results).toContain('Fix closure accuracy | `8 / 8 = 100%`');
    expect(results).toContain('Mandatory collector adoption | `7 / 8 = 87.5%` | `100%`');
    expect(results).toContain('Full execution-contract stability | two historical violations, six passes');
    expect(results).toContain('client network-isolation Fail');
    expect(results).toContain('does not retroactively convert the private Fix run into a pass');
    expect(results).toContain('prospective Fix replacement window');
    expect(results).toContain('stopped the replacement window at `2 / 3`');
    expect(results).toContain('Plan 02 independently completes at `3 / 3`');
    expect(results).toContain('Corrected-procedure payment-log Fix replacement');
    expect(results).toContain('Distinct delivery-completeness Fix replacement');
    expect(results).toContain('Plan 02 unchanged payment-log Fix repeat');
    expect(results).toContain('Plan 02 distinct blacklist unread-badge Fix');
    expect(results).toContain('Plan 02 unchanged blacklist unread-badge Fix repeat');
    expect(results).toContain('existing sanitized payment-log Fix chain');
    expect(results).toContain('new, distinct, sanitized real Fix chain');
    expect(results).toContain('One byte-identical unchanged repeat of that new chain');
    expect(results).toContain('All historical failures remain in the report');
    expect(results).toContain('Plan 02 therefore completes at `3 / 3`');
    expect(results).toContain('approved for the stable `v0.3.0` release');
    expect(results).toContain('## Final Release-readiness Validation');
    expect(results).toContain('`8 / 8` files and `80 / 80` tests passed');
    expect(results).toContain('both reported `Skill is valid!`');
    expect(results).toContain('all 19 model-readable files');
    expect(results).toContain('Both previous-candidate Quick runs ignored the available collector');
    expect(results).not.toContain('No Quick run used the final Skill content');
  });
});

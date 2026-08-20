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

  test('documents the candidate version and stable bilingual installation evidence', () => {
    const packageJson = JSON.parse(readText('package.json')) as { version: string };
    const readme = readText('README.md');
    const chineseReadme = readText('README.zh-CN.md');
    const compatibility = readText('docs/compatibility.md');

    expect(packageJson.version).toBe('0.3.0');
    expect(readme).toContain('README.zh-CN.md');
    expect(readme).toContain('--branch v0.2.2');
    expect(readme).toContain('Runtime verified');
    expect(readme).toContain('### v0.3.0 Release Candidate');
    expect(readme).toContain('Stable installation remains pinned to `v0.2.2`');
    expect(readme).toContain('part of stable `v0.2.0`');
    expect(chineseReadme).toContain('安装稳定版本');
    expect(chineseReadme).toContain('--branch v0.2.2');
    expect(chineseReadme).toContain('Cannot Verify：无法验证');
    expect(chineseReadme).toContain('### v0.3.0 候选版本');
    expect(chineseReadme).toContain('稳定安装继续固定到 `v0.2.2`');
    expect(chineseReadme).toContain('属于稳定版 `v0.2.0`');
    expect(compatibility).toContain('Structural verified');
    expect(compatibility).toContain('Stable evidence baseline: [`v0.2.2`]');
    expect(compatibility).toContain('Candidate under test: `v0.3.0` working tree');
    expect(compatibility).toContain('## v0.3.0 Candidate Evidence');
    expect(compatibility).toContain('a66e26e60e27f643f35b402c6660038c7070e759');
  });

  test('associates compatibility evidence with the correct client and release contract', () => {
    const readme = readText('README.md');
    const compatibility = readText('docs/compatibility.md');
    const roadmap = readText('docs/roadmap.md');
    const results = readText('docs/evaluation-results/v0.2.0.md');
    const historical = markdownSection(compatibility, '## Historical v0.1.1 Evidence');
    const stable = markdownSection(compatibility, '## Stable v0.2.2 Evidence');
    const candidate = markdownSection(compatibility, '## v0.3.0 Candidate Evidence');
    const limitations = markdownSection(compatibility, '## Known Limitations');
    const historicalClaudeRow = markdownTableRow(historical, 'Claude Code');
    const historicalCursorRow = markdownTableRow(historical, 'Cursor');
    const stableCodexRow = markdownTableRow(stable, 'Codex CLI 0.146.0');
    const stableCursorRow = markdownTableRow(stable, 'Cursor Agent CLI 2026.08.04-aaa8809');
    const stableClaudeRow = markdownTableRow(stable, 'Claude Code');
    const candidateCodexRow = markdownTableRow(candidate, 'Codex CLI 0.146.0');
    const candidateCursorRow = markdownTableRow(candidate, 'Cursor');
    const candidateClaudeRow = markdownTableRow(candidate, 'Claude Code');
    const readmeStable = markdownSection(readme, '### Stable v0.2.2');
    const readmeCursorRow = markdownTableRow(
      readmeStable,
      'Cursor Agent CLI 2026.08.04-aaa8809',
    );
    const resultsCursorRow = markdownTableRow(results, 'Cursor');

    expect(historicalClaudeRow).toContain('Not executed because the available account subscription expired');
    expect(historicalClaudeRow).toMatch(/\| Cannot Verify \|$/);

    expect(historicalCursorRow).toContain('v0.1.0 Quick Review');
    expect(historicalCursorRow).toMatch(/\| Runtime verified \|$/);
    expect(historicalCursorRow).not.toContain('Deep');
    expect(historicalCursorRow).not.toContain('Fix');
    expect(stable).toContain('does not add a review mode, output section, Finding field, or install path');
    expect(stableCodexRow).toContain('Post-release Quick review found all three seeded issues');
    expect(stableCodexRow).toMatch(/\| Runtime verified \|$/);
    expect(stableCursorRow).toContain('Candidate Deep/Fix and post-release Quick reviews');
    expect(stableCursorRow).toContain('119 events and 15 tool calls');
    expect(stableCursorRow).toMatch(/\| Runtime verified \|$/);
    expect(readmeCursorRow).toMatch(/\| Runtime verified \|$/);
    expect(resultsCursorRow).toContain('| Runtime verified |');
    expect(roadmap).toContain('post-hardening Cursor CLI Improve-only Quick rerun');
    expect(roadmap).toContain('post-hardening final Deep Review passed against the committed candidate');
    expect(roadmap).not.toContain('final Deep Review against an immutable commit candidate after commit approval');
    expect(stableClaudeRow).toContain('valid runtime credentials are unavailable');
    expect(stableClaudeRow).toMatch(/\| Cannot Verify \|$/);
    expect(candidateCodexRow).toContain('prospective Fix replacement window passes `3 / 3`');
    expect(candidateCodexRow).toMatch(/\| Runtime verified \|$/);
    expect(candidateCursorRow).toContain('Not rerun against the exact v0.3.0 candidate');
    expect(candidateCursorRow).toMatch(/\| Cannot Verify \|$/);
    expect(candidateClaudeRow).toMatch(/\| Cannot Verify \|$/);
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
    expect(changelog).toContain('## [0.3.0] - Release Candidate');
    expect(changelog).toContain('## [0.2.2] - 2026-08-06');
    expect(changelog).toContain('## [0.2.1] - 2026-08-05');
    expect(changelog).toContain('## [0.2.0] - 2026-07-31');
    expect(changelog).toContain('## [0.1.1] - 2026-07-23');
    expect(changelog).toContain('## [0.1.0] - 2026-07-23');
    expect(changelog).toContain('compare/v0.2.2...HEAD');
    expect(changelog).toContain('[0.3.0]: https://github.com/keykovar/skill-fe-code-review/compare/v0.2.2...HEAD');
    expect(changelog).toContain('compare/v0.2.1...v0.2.2');
    expect(changelog).toContain('compare/v0.2.0...v0.2.1');
    expect(changelog).toContain('compare/v0.1.1...v0.2.0');
    expect(changelog).not.toContain('compare/v0.1.1...HEAD');
    expect(versioning).toContain('Patch');
    expect(versioning).toContain('Minor');
    expect(versioning).toContain('Major');
    expect(versioning).toContain('Release tags are immutable');
    expect(versioning).toContain('Cannot Verify');
    expect(versioning).toContain('Stable: `v0.2.2`');
    expect(versioning).toContain('Previous stable: `v0.2.1`');
    expect(versioning).toContain('Release candidate: `v0.3.0`');
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
    expect(roadmap).toContain('Automatic code edits');
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

  test('publishes the exact v0.3.0 candidate window without promoting synthetic evidence', () => {
    const results = readText('docs/evaluation-results/v0.3.0-candidate.md');

    expect(results).toContain('# v0.3.0 Candidate Evaluation Results');
    expect(results).toContain('Candidate decision: `Go`');
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
    expect(results).toContain('the evaluated candidate is `Go` for a stable `v0.3.0` release');
    expect(results).toContain('## Final Release-readiness Validation');
    expect(results).toContain('`8 / 8` files and `80 / 80` tests passed');
    expect(results).toContain('both reported `Skill is valid!`');
    expect(results).toContain('all 19 model-readable files');
    expect(results).toContain('Both previous-candidate Quick runs ignored the available collector');
    expect(results).not.toContain('No Quick run used the final Skill content');
  });
});

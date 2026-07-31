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
    expect(exists('examples/outputs/fix-review.zh-CN.md')).toBe(true);
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

  test('documents stable bilingual installation and compatibility evidence', () => {
    const packageJson = JSON.parse(readText('package.json')) as { version: string };
    const readme = readText('README.md');
    const chineseReadme = readText('README.zh-CN.md');
    const compatibility = readText('docs/compatibility.md');

    expect(packageJson.version).toBe('0.2.0');
    expect(readme).toContain('README.zh-CN.md');
    expect(readme).toContain('--branch v0.1.1');
    expect(readme).toContain('Runtime verified');
    expect(readme).toContain('part of the `v0.2.0` release candidate on `main`');
    expect(chineseReadme).toContain('安装稳定版本');
    expect(chineseReadme).toContain('--branch v0.1.1');
    expect(chineseReadme).toContain('Cannot Verify：无法验证');
    expect(chineseReadme).toContain('属于 `main` 上的 `v0.2.0` 候选版本');
    expect(compatibility).toContain('Structural verified');
    expect(compatibility).toContain('Stable evidence baseline: [`v0.1.1`]');
    expect(compatibility).toContain('Candidate under test: `v0.2.0`');
    expect(compatibility).toContain('a66e26e60e27f643f35b402c6660038c7070e759');
  });

  test('associates compatibility evidence with the correct client and release contract', () => {
    const readme = readText('README.md');
    const compatibility = readText('docs/compatibility.md');
    const roadmap = readText('docs/roadmap.md');
    const results = readText('docs/evaluation-results/v0.2.0.md');
    const claudeRow = markdownTableRow(compatibility, 'Claude Code');
    const cursorRow = markdownTableRow(compatibility, 'Cursor');
    const candidate = markdownSection(compatibility, '## v0.2.0 Candidate Evidence');
    const limitations = markdownSection(compatibility, '## Known Limitations');
    const candidateCodexRow = markdownTableRow(candidate, 'Codex');
    const candidateCursorRow = markdownTableRow(candidate, 'Cursor');
    const candidateClaudeRow = markdownTableRow(candidate, 'Claude Code');
    const readmeCandidate = markdownSection(readme, '### v0.2.0 Release Candidate');
    const readmeCursorRow = markdownTableRow(
      readmeCandidate,
      'Cursor Desktop 3.13.25 / CLI 2026.01.23',
    );
    const resultsCursorRow = markdownTableRow(results, 'Cursor');

    expect(claudeRow).toContain('Not executed because the available account subscription expired');
    expect(claudeRow).toMatch(/\| Cannot Verify \|$/);

    expect(cursorRow).toContain('v0.1.0 Quick Review');
    expect(cursorRow).toMatch(/\| Runtime verified \|$/);
    expect(cursorRow).not.toContain('Deep');
    expect(cursorRow).not.toContain('Fix');
    expect(candidate).toContain('Stable v0.1.1 runtime results remain historical evidence');
    expect(candidate).toContain('they do not verify the candidate');
    expect(candidateCodexRow).toContain('Quick, Deep, and Fix Review smoke runs');
    expect(candidateCodexRow).toMatch(/\| Runtime verified \|$/);
    expect(candidateCursorRow).toContain('post-hardening Cursor CLI 2026.01.23');
    expect(candidateCursorRow).toContain('explicitly non-blocking final recommendation');
    expect(candidateCursorRow).toMatch(/\| Runtime verified \|$/);
    expect(readmeCursorRow).toMatch(/\| Runtime verified \|$/);
    expect(resultsCursorRow).toContain('| Runtime verified |');
    expect(roadmap).toContain('post-hardening Cursor CLI Improve-only Quick rerun');
    expect(roadmap).toContain('final Deep Review against an immutable commit candidate');
    expect(roadmap).not.toContain('final Deep Review passed');
    expect(candidateClaudeRow).toContain('valid runtime credentials are unavailable');
    expect(candidateClaudeRow).toMatch(/\| Cannot Verify \|$/);
    expect(limitations).toContain('post-hardening recommendation gate was rerun in Cursor CLI 2026.01.23');
    expect(limitations).toContain('does not prove identical behavior across every Cursor surface');
    expect(limitations).toContain('manual synthetic-fixture dataset');
    expect(limitations).toContain('No candidate result claims browser runtime evidence');
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
    expect(changelog).toContain('## [0.2.0] - Release Candidate');
    expect(changelog).toContain('## [0.1.1] - 2026-07-23');
    expect(changelog).toContain('## [0.1.0] - 2026-07-23');
    expect(changelog.match(/compare\/v0\.1\.1\.\.\.HEAD/g)).toHaveLength(2);
    expect(changelog).not.toContain('compare/v0.2.0...HEAD');
    expect(versioning).toContain('Patch');
    expect(versioning).toContain('Minor');
    expect(versioning).toContain('Major');
    expect(versioning).toContain('Release tags are immutable');
    expect(versioning).toContain('Cannot Verify');
    expect(versioning).toContain('Stable: `v0.1.1`');
    expect(versioning).toContain('Release candidate: `v0.2.0`');
  });

  test('ships issue forms and an evidence-driven roadmap', () => {
    expect(exists('.github/ISSUE_TEMPLATE/bug_report.yml')).toBe(true);
    expect(exists('.github/ISSUE_TEMPLATE/feature_request.yml')).toBe(true);
    expect(exists('.github/ISSUE_TEMPLATE/config.yml')).toBe(true);

    const roadmap = readText('docs/roadmap.md');
    expect(roadmap).toContain('v0.2.0 Candidates');
    expect(roadmap).toContain('v0.2.0 Promotion Gates');
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

  test('documents v0.2.0 candidate runtime and oracle evidence without overstating release readiness', () => {
    const results = readText('docs/evaluation-results/v0.2.0.md');

    expect(results).toContain('# v0.2.0 Candidate Evaluation Results');
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
    expect(results).toContain('final immutable-target Deep Review remains pending');
    expect(results).toContain('not for tag or publication until the immutable commit');
  });
});

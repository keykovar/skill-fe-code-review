import { describe, expect, test } from 'vitest';

import { exists, readText } from './test-utils';

describe('repository release support', () => {
  test('documents local evaluation expectations', () => {
    const evaluation = readText('docs/evaluation.md');

    expect(evaluation).toContain('Use this checklist before publishing');
    expect(evaluation).toContain('untracked file referenced by tracked changes');
    expect(evaluation).toContain('One Fix Review');
    expect(evaluation).toContain('before/after behavior');
    expect(evaluation).toContain('New Regression：新增回归');
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

    expect(packageJson.version).toBe('0.1.1');
    expect(readme).toContain('README.zh-CN.md');
    expect(readme).toContain('--branch v0.1.1');
    expect(readme).toContain('Runtime verified');
    expect(chineseReadme).toContain('安装稳定版本');
    expect(chineseReadme).toContain('--branch v0.1.1');
    expect(chineseReadme).toContain('Cannot Verify：无法验证');
    expect(compatibility).toContain('Structural verified');
    expect(compatibility).toContain('Release under test: [`v0.1.1`]');
    expect(compatibility).toContain('Claude Code');
    expect(compatibility).toContain('Cannot Verify');
    expect(compatibility).toContain('a66e26e60e27f643f35b402c6660038c7070e759');
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
  });

  test('records release history and semantic version rules', () => {
    const changelog = readText('CHANGELOG.md');
    const versioning = readText('docs/versioning.md');

    expect(changelog).toContain('## [Unreleased]');
    expect(changelog).toContain('## [0.1.1] - 2026-07-23');
    expect(changelog).toContain('## [0.1.0] - 2026-07-23');
    expect(changelog).toContain('compare/v0.1.1...HEAD');
    expect(versioning).toContain('Patch');
    expect(versioning).toContain('Minor');
    expect(versioning).toContain('Major');
    expect(versioning).toContain('Release tags are immutable');
    expect(versioning).toContain('Cannot Verify');
    expect(versioning).toContain('Stable: `v0.1.1`');
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
});

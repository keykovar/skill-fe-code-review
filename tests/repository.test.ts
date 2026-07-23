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
    const readme = readText('README.md');
    const chineseReadme = readText('README.zh-CN.md');
    const compatibility = readText('docs/compatibility.md');

    expect(readme).toContain('README.zh-CN.md');
    expect(readme).toContain('--branch v0.1.0');
    expect(readme).toContain('Runtime verified');
    expect(chineseReadme).toContain('安装稳定版本');
    expect(chineseReadme).toContain('Cannot Verify：无法验证');
    expect(compatibility).toContain('Structural verified');
    expect(compatibility).toContain('Claude Code');
    expect(compatibility).toContain('Cannot Verify');
  });

  test('records release history and semantic version rules', () => {
    const changelog = readText('CHANGELOG.md');
    const versioning = readText('docs/versioning.md');

    expect(changelog).toContain('## [Unreleased]');
    expect(changelog).toContain('## [0.1.0] - 2026-07-23');
    expect(versioning).toContain('Patch');
    expect(versioning).toContain('Minor');
    expect(versioning).toContain('Major');
    expect(versioning).toContain('Release tags are immutable');
    expect(versioning).toContain('Cannot Verify');
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
});

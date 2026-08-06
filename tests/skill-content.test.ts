import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

import { readText, skillDir, skillMd } from './test-utils';

const quickReview = readText('skills/fe-code-review/references/quick-review.md');
const deepReview = readText('skills/fe-code-review/references/deep-review.md');
const fixReview = readText('skills/fe-code-review/references/fix-review.md');

const quickHeadings = [
  '## 总体结论',
  '## 审查范围',
  '## Blocking：必须修改',
  '## Risk：建议修改',
  '## Improve：可优化',
  '## Design / Simplify：设计与简化',
  '## Naming / Readability：命名与可读性',
  '## File Placement / Module Boundary：文件存放与模块边界',
  '## Test Gaps：测试缺口',
  '## Evidence：证据',
  '## 最终建议',
];

const deepHeadings = [
  '## 总体结论',
  '## 变更理解',
  '## Change Map：变更地图',
  '## Findings：问题列表',
  '## Requirement Gaps：需求缺口',
  '## Design / Simplify：设计与简化',
  '## Naming / Readability：命名与可读性',
  '## File Placement / Module Boundary：文件存放与模块边界',
  '## Test Gaps：测试缺口',
  '## Release Risks：上线风险',
  '## Evidence：证据',
  '## 最终建议',
];

const fixHeadings = [
  '## 回审结论',
  '## 回审范围',
  '## Issue Verification：问题验证',
  '## New Regression：新增回归',
  '## Behavior Delta：行为差异',
  '## Test Gaps：测试缺口',
  '## Evidence：证据',
  '## 最终建议',
];

function chineseOutputTemplate(markdown: string): string {
  const template = markdown.match(/```md\n([\s\S]*?)\n```/);

  if (!template) {
    throw new Error('Missing Markdown output template');
  }

  return template[1];
}

function chineseTemplateTopLevelHeadings(markdown: string): string[] {
  return chineseOutputTemplate(markdown).match(/^## .+$/gm) ?? [];
}

function englishTemplateTopLevelHeadings(markdown: string): string[] {
  const englishTemplate = markdown.split('## English Output Template')[1];
  const headings = englishTemplate?.match(/headings:\s*([^\n.]+)\./)?.[1];

  if (!headings) {
    throw new Error('Missing English output template headings');
  }

  return Array.from(headings.matchAll(/`([^`]+)`/g), ([, heading]) => `## ${heading}`);
}

function markdownSection(markdown: string, heading: string): string {
  const start = markdown.indexOf(`## ${heading}`);

  if (start === -1) {
    throw new Error(`Missing Markdown section: ${heading}`);
  }

  const remaining = markdown.slice(start + `## ${heading}`.length);
  const nextHeading = remaining.search(/\n## /);
  return nextHeading === -1 ? remaining : remaining.slice(0, nextHeading);
}

describe('skill content', () => {
  test('defines read-only safety boundaries', () => {
    expect(skillMd).toContain('Default to read-only review');
    expect(skillMd).toContain('Translate section headings');
    expect(skillMd).toContain('Do not use English-only section headings');
    expect(skillMd).toContain('Do not modify files');
    expect(skillMd).toContain('format files');
    expect(skillMd).toContain('commit');
    expect(skillMd).toContain('push');
    expect(skillMd).toContain('install packages');
    expect(skillMd).toContain('change branches');
  });

  test('defines review modes and output sections', () => {
    expect(quickReview).toContain('# Quick Review');
    expect(deepReview).toContain('# Deep Review');
    expect(skillMd).toContain('## Fix Review Rules');
    expect(skillMd).toContain('## Finding Requirements');
    expect(skillMd).toContain('Blocking');
    expect(skillMd).toContain('Risk');
    expect(skillMd).toContain('Improve');
    expect(quickReview).toContain('Review Scope');
    expect(quickReview).toContain('Test Gaps');
    expect(quickReview).toContain('Evidence');
  });

  test('defines Chinese output templates for stable localized headings', () => {
    expect(skillMd).toContain('use the Chinese template for the selected mode');
    expect(quickReview).toContain('## Chinese Output Template');
    expect(quickReview).toContain('## 总体结论');
    expect(quickReview).toContain('## 审查范围');
    expect(quickReview).toContain('## Blocking：必须修改');
    expect(quickReview).toContain('## Risk：建议修改');
    expect(quickReview).toContain('## Improve：可优化');
    expect(quickReview).toContain('## Test Gaps：测试缺口');
    expect(quickReview).toContain('## Evidence：证据');
    expect(quickReview).toContain('## 最终建议');
  });

  test('requires fixed Deep Review sections even when empty', () => {
    expect(deepReview).toContain('Use every top-level section exactly once');
    expect(deepReview).toContain('Change Map：变更地图');
    expect(deepReview).toContain('Requirement Gaps：需求缺口');
    expect(deepReview).toContain('Design / Simplify：设计与简化');
    expect(deepReview).toContain('Naming / Readability：命名与可读性');
    expect(deepReview).toContain('File Placement / Module Boundary：文件存放与模块边界');
    expect(deepReview).toContain('无明确问题。');
  });

  test('requires before and after behavior comparison in every mode', () => {
    expect(skillMd).toContain('## Before/After Behavior Analysis');
    expect(skillMd).toContain('Compare behavior, not only changed lines');
    expect(skillMd).toContain('missing branches, guards, fallbacks, cleanup');
    expect(skillMd).toContain('affected callers, consumers, events, API contracts');
    expect(skillMd).toContain('If the baseline cannot be read');
    expect(quickReview).toContain('修改前后行为');
    expect(deepReview).toContain('修改前行为');
    expect(deepReview).toContain('缺失 / 移除行为');
  });

  test('defines Fix Review closure statuses and regression reporting', () => {
    expect(skillMd).toContain('Use Fix Review when');
    expect(skillMd).toContain('Resolved：已解决');
    expect(skillMd).toContain('Partially Resolved：部分解决');
    expect(skillMd).toContain('Unresolved：未解决');
    expect(skillMd).toContain('Cannot Verify：无法验证');
    expect(skillMd).toContain('New Regression：新增回归');
    expect(fixReview).toContain('## Issue Verification：问题验证');
    expect(fixReview).toContain('## Behavior Delta：行为差异');
    expect(fixReview).toContain('原严重级别');
  });

  test('requires actionable recommendations', () => {
    expect(skillMd).toContain('Suggested fix');
    expect(skillMd).toContain('Verification');
    expect(skillMd).toContain('Root cause');
    expect(skillMd).toContain('If multiple fixes are possible');
  });

  test('keeps conclusion and final recommendation severity gates consistent', () => {
    const recommendationRules = markdownSection(skillMd, 'Recommendation Consistency');

    expect(recommendationRules).toContain('Treat the conclusion and final recommendation as one decision contract');
    expect(recommendationRules).toContain('Any Blocking finding requires at least `修改后提交`');
    expect(recommendationRules).toContain('An Improve-only review remains `可以提交`');
    expect(recommendationRules).toContain('state whether it is a pre-submit or pre-next-step condition');
    expect(recommendationRules).toContain('Do not introduce a new `before submit`');
    expect(recommendationRules).toContain('use `可以关闭` only when every previous finding is Resolved');
    const fixRecommendationCases = [
      ['可以关闭', 'every previous finding is Resolved'],
      ['修改后再次回审', 'Partially Resolved or Unresolved'],
      ['暂时无法确认', 'Cannot Verify'],
    ];

    for (const [recommendation, condition] of fixRecommendationCases) {
      expect(recommendationRules).toContain(`\`${recommendation}\``);
      expect(recommendationRules).toContain(condition);
    }

    expect(skillMd).toContain('single authority for the closure recommendation');
    expect(skillMd).not.toContain('Recommend closure only when all Blocking findings are Resolved');
    expect(quickReview).toContain('do not add `建议提交前`');
    expect(quickReview).toContain('仅有 Improve 时明确说明优化不影响提交');
    expect(deepReview).toContain('An Improve-only review uses `可以进入下一步`');
    expect(fixReview).toContain('must describe the same closure state');
  });

  test('uses local evidence first and follows documentation tool contracts', () => {
    const context7Contract = skillMd
      .split(/\n\n+/)
      .find((paragraph) => paragraph.includes('official Context7 MCP tool contract'));

    expect(context7Contract).toBeDefined();
    expect(skillMd).toContain('Use evidence in this order');
    expect(skillMd).toContain(
      'Repository source, diffs, call paths, tests, configuration, lockfiles, and project documentation',
    );
    expect(skillMd).toContain('Installed dependency types and source for the resolved local version');
    expect(skillMd).toContain('whose tool contract permits code review');
    expect(context7Contract).toContain('directly or indirectly');
    expect(context7Contract).toMatch(/subagent|delegate/i);
    expect(context7Contract).toMatch(/proxy/i);
    expect(context7Contract).toMatch(/wrapper/i);
    expect(context7Contract).toMatch(/another tool or session/i);
    expect(context7Contract).toMatch(/refram/i);
    expect(context7Contract).toMatch(/decompos/i);
    expect(context7Contract).toMatch(/sanitiz/i);
    expect(context7Contract).toMatch(/relabel/i);
    expect(skillMd).toContain('mark it `Cannot Verify` and identify the missing evidence');
    expect(skillMd).toContain('Never send private source code, diffs, repository paths');
    expect(skillMd).toContain('credentials, tokens, user data, or proprietary identifiers');
    expect(skillMd).not.toContain(
      'Use Context7 or another official documentation lookup only when framework or library behavior matters',
    );

    const context7SkillFiles = [
      { name: 'SKILL.md', content: skillMd },
      ...fs
        .readdirSync(path.join(skillDir, 'references'))
        .filter((name) => name.endsWith('.md'))
        .map((name) => ({
          name: `references/${name}`,
          content: fs.readFileSync(path.join(skillDir, 'references', name), 'utf8'),
        })),
    ].filter(({ content }) => /Context7/i.test(content));

    expect(context7SkillFiles.map(({ name }) => name)).toEqual(['SKILL.md']);
  });

  test('treats browser automation as conditional runtime evidence', () => {
    const browserContract = markdownSection(skillMd, 'Conditional Browser Runtime Evidence');

    expect(browserContract).toContain(
      'Use Playwright or another available browser automation tool only when all of these conditions hold',
    );
    expect(browserContract).toContain('expected observable result is explicit');
    expect(browserContract).toContain('initial state is controlled and repeatable');
    expect(browserContract).toContain(
      'without installing dependencies, changing project configuration, or writing generated artifacts into the repository',
    );
    expect(browserContract).toContain('destructive actions, or irreversible external side effects');
    expect(browserContract).toContain('initial state and how it is reproduced, expected result');
    expect(browserContract).toContain('Mask credentials, tokens, personal data, request bodies');
    expect(browserContract).toContain('does not replace real WebView, Native bridge, device, backend');
    expect(browserContract).toContain('deployment, monitoring, or production verification');
  });

  test('keeps Cannot Verify separate from severity and mode-specific decisions', () => {
    const findingRequirements = markdownSection(skillMd, 'Finding Requirements');

    expect(findingRequirements).toContain(
      'For Quick and Deep Review, `Cannot Verify` is an evidence disposition, not a severity',
    );
    expect(findingRequirements).toContain('missing evidence alone does not create a finding');
    expect(findingRequirements).toContain('keep its demonstrated Blocking, Risk, or Improve severity');
    expect(findingRequirements).toContain(
      'This does not change `Cannot Verify` as a `Design / Simplify` decision or as a Fix Review closure status',
    );
    expect(deepReview).toContain('`Cannot Verify` describes evidence status, not finding severity');
  });

  test('defines bounded browser evidence budgets for every review mode', () => {
    expect(quickReview).toContain('Do not start Playwright or other browser automation by default');
    expect(quickReview).toContain('at most that one critical path');
    expect(deepReview).toContain('verify the primary user path and at most one additional high-risk path');
    expect(deepReview).toContain('supported by code, diff, requirement, incident, or test evidence');
    expect(fixReview).toContain(
      'reuse the original reproduction environment, initial state, steps, and observable assertions',
    );
    expect(fixReview).toContain(
      'If any original element is unavailable or cannot be reproduced equivalently, use `Cannot Verify`',
    );
  });

  test('keeps Fix Review independent from Deep Review mode and budget', () => {
    const fixRules = markdownSection(skillMd, 'Fix Review Rules');

    expect(fixRules).toContain('Keep the Fix Review template and focused verification budget');
    expect(fixRules).toContain('do not silently switch to or blend in Deep Review');
    expect(fixRules).toContain('run it only as a separately selected mode');
    expect(fixReview).toContain('Stay in Fix Review and keep its focused template and verification budget');
    expect(fixReview).toContain('Recommend a separate Deep Review with an explicit scope');
    expect(fixReview).not.toContain('Expand to Deep Review');
  });

  test('adds evidence fields without changing mode template sections', () => {
    for (const mode of [quickReview, deepReview, fixReview]) {
      expect(mode).toContain('- 官方文档核验：');
      expect(mode).toContain('- 浏览器运行证据：');
      expect(mode).not.toContain('- 官方文档 / Context7：');
    }

    const requiredScopeFields = [
      '- 请求范围：',
      '- 已修改：',
      '- 已暂存：',
      '- 未暂存：',
      '- 未跟踪：',
      '- 已执行验证：',
      '- 跳过的验证：',
    ];

    for (const mode of [deepReview, fixReview]) {
      const template = chineseOutputTemplate(mode);

      for (const field of requiredScopeFields) {
        expect(template).toContain(field);
      }
    }

    const fixTemplate = chineseOutputTemplate(fixReview);
    for (const field of [
      '- 上次审查基线：',
      '- 原始变更范围：',
      '- 本次修复范围：',
      '- 比较基线：',
      '- 涉及文件与调用链：',
    ]) {
      expect(fixTemplate).toContain(field);
    }

    expect(chineseTemplateTopLevelHeadings(quickReview)).toEqual(quickHeadings);
    expect(chineseTemplateTopLevelHeadings(deepReview)).toEqual(deepHeadings);
    expect(chineseTemplateTopLevelHeadings(fixReview)).toEqual(fixHeadings);
  });

  test('defines exact English top-level sections for every mode', () => {
    expect(englishTemplateTopLevelHeadings(quickReview)).toEqual([
      '## Overall Conclusion',
      '## Review Scope',
      '## Blocking',
      '## Risk',
      '## Improve',
      '## Design / Simplify',
      '## Naming / Readability',
      '## File Placement / Module Boundary',
      '## Test Gaps',
      '## Evidence',
      '## Final Recommendation',
    ]);
    expect(englishTemplateTopLevelHeadings(deepReview)).toEqual([
      '## Overall Conclusion',
      '## Change Understanding',
      '## Change Map',
      '## Findings',
      '## Requirement Gaps',
      '## Design / Simplify',
      '## Naming / Readability',
      '## File Placement / Module Boundary',
      '## Test Gaps',
      '## Release Risks',
      '## Evidence',
      '## Final Recommendation',
    ]);
    expect(englishTemplateTopLevelHeadings(fixReview)).toEqual([
      '## Review Conclusion',
      '## Review Scope',
      '## Issue Verification',
      '## New Regression',
      '## Behavior Delta',
      '## Test Gaps',
      '## Evidence',
      '## Final Recommendation',
    ]);
  });

  test('classifies referenced untracked files as blocking', () => {
    expect(skillMd).toContain('Treat untracked files as submit-blocking');
    expect(skillMd).toContain('Do not recommend `can submit`');
    expect(skillMd).toContain('clean checkout, CI, or another developer');
  });

  test('covers design, simplification, naming, readability, and module boundaries', () => {
    expect(skillMd).toContain('Code design and simplification');
    expect(skillMd).toContain('Naming and readability');
    expect(skillMd).toContain('File placement and module boundaries');
    expect(quickReview).toContain('Design / Simplify');
    expect(quickReview).toContain('File Placement / Module Boundary');
    expect(quickReview).toContain('No clear issue.');
  });

  test('keeps review and evaluation output in chat unless file writes are explicit', () => {
    expect(skillMd).toContain('authorizes chat output only');
    expect(skillMd).toContain('Client modes named Agent, Build, Write, or similar do not override this boundary');
  });

  test('defines evidence-backed minimal sufficient design checks', () => {
    expect(skillMd).toContain('## Minimal Sufficient Design');
    expect(skillMd).toContain('Minimal does not mean the fewest lines of code');
    expect(skillMd).toContain('Do not extract solely because code looks similar');
    expect(skillMd).toContain('actual producers, consumers, baseline behavior, and runtime inputs');
    expect(skillMd).toContain('Do not recommend simplification that weakens correctness');
    expect(skillMd).toContain('a later competing owner can be deleted');
    expect(skillMd).toContain('Cross-module file changes alone do not make that a `Redesign`');
    expect(skillMd).toContain('instead of returning to an existing one');
    expect(skillMd).toContain('do not perform a repository-wide abstraction audit');
    expect(skillMd).toContain('use `Cannot Verify` and state the missing evidence');
    expect(skillMd).toContain('selected mode is too narrow to support the decision');
    expect(skillMd).toContain('`Redesign` in Deep Review');
    expect(skillMd).toContain('Report each actionable design issue once');
    expect(skillMd).toContain('Every `Simplify`, `Extract`, or `Redesign` decision must cite');
    expect(quickReview).toContain('bounded minimal-sufficient-design check');
    expect(quickReview).toContain('clear, local, evidence-backed overdesign');
    expect(quickReview).toContain('Keep`, `Simplify`, `Extract`, or `Cannot Verify');
    expect(quickReview).toContain('actionable issue reported once under its applicable severity section');
    expect(quickReview).toContain('do not emit `Redesign` in Quick Review');
    expect(quickReview).toContain('too narrow to verify its cross-module blast radius');
    expect(quickReview).not.toContain('Keep / Simplify / Extract / Redesign');
    expect(deepReview).toContain('Distinguish semantic duplication from merely similar syntax');
    expect(deepReview).toContain('simpler viable alternative');
    expect(deepReview).toContain('correctness, stability, coupling, and maintenance tradeoff');
    expect(deepReview).toContain('do not manufacture an issue');
    expect(deepReview).toContain('use `Keep` when inspected evidence supports the current implementation');
    expect(deepReview).toContain('use `Cannot Verify` when evidence is insufficient');
  });

  test('keeps openai metadata usable', () => {
    const openaiYaml = readText('skills/fe-code-review/agents/openai.yaml');

    expect(openaiYaml).toContain('display_name: "FE Code Review"');
    expect(openaiYaml).toContain('Quick, Deep, or Fix');
    expect(openaiYaml).toContain('default_prompt: "Use $fe-code-review');
  });
});

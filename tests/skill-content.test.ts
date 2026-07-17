import { describe, expect, test } from 'vitest';

import { readText, skillMd } from './test-utils';

const quickReview = readText('skills/fe-code-review/references/quick-review.md');
const deepReview = readText('skills/fe-code-review/references/deep-review.md');
const fixReview = readText('skills/fe-code-review/references/fix-review.md');

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

  test('keeps openai metadata usable', () => {
    const openaiYaml = readText('skills/fe-code-review/agents/openai.yaml');

    expect(openaiYaml).toContain('display_name: "FE Code Review"');
    expect(openaiYaml).toContain('Quick, Deep, or Fix');
    expect(openaiYaml).toContain('default_prompt: "Use $fe-code-review');
  });
});

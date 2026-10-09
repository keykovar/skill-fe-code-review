import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { buildOriginOccurrenceIntegrated } from '../scripts/build-origin-occurrence-integrated.mjs';
import { evaluateIntegratedOriginOccurrenceReport } from '../scripts/adjudicate-origin-occurrence-integrated.mjs';
import { validateOriginOccurrenceIntegrated } from '../scripts/validate-origin-occurrence-integrated.mjs';
import { readText, readHistoricalText, rootDir } from './test-utils';

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-review-integration-test-'));
const output = path.join(temporary, 'candidate');
const manifest = buildOriginOccurrenceIntegrated(output);
const read = (filename: string) => fs.readFileSync(path.join(output, filename), 'utf8');
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const prefix = 'skill/fe-code-review';
afterAll(() => fs.rmSync(temporary, { recursive: true, force: true }));

describe('integrated candidate assembly', () => {
  test('preserves every baseline core rule except the declared Coverage presentation change', () => {
    const original = readHistoricalText('skills/fe-code-review/SKILL.md');
    const candidate = read(`${prefix}/SKILL.md`);
    for (const paragraph of original.trim().split('\n\n')) {
      expect(candidate).toContain(paragraph.replace('with this exact shape:', 'with this shape (plain location shown; the linked variant is specified below):'));
    }
    expect(candidate.split('---')[1]).toBe(original.split('---')[1]);
    expect(candidate).not.toContain('fe-code-review-origin-candidate');
    expect(manifest.ruleInventory.preserved).toHaveLength(13);
  });

  test('retains the substantive shared field semantics in the core, including the non-optional final check', () => {
    const original = readText('evaluation/prototypes/origin-occurrence/fe-code-review-origin-candidate/SKILL.md');
    const candidate = read(`${prefix}/SKILL.md`);
    const section = original.slice(original.indexOf('## Origin\n')).replace(/^## /gmu, '### ')
      .replace("the stable core's `Severity Rules`", '`Severity Rules`').replace('using the stable rules', 'using the severity rules');
    expect(candidate).toContain(section);
    expect(manifest.ruleInventory.templateItemsWithFields).toEqual({ quick: 3, deep: 3, fix: 4 });
  });

  test('keeps all eight other Skill files byte-identical, including client policy and collection helper', () => {
    expect(manifest.ruleInventory.unchangedFiles).toHaveLength(8);
    for (const target of manifest.ruleInventory.unchangedFiles) {
      expect(read(target)).toBe(readText(target.replace('skill/fe-code-review/', 'skills/fe-code-review/')));
    }
    expect(manifest.outputs.filter((item: any) => item.path.startsWith(`${prefix}/`))).toHaveLength(12);
    expect(manifest.runtimeReady).toBe(false);
    expect(manifest.modelInvocations).toBe(0);
  });

  test.each(['quick', 'deep', 'fix'])('every %s template item carries two fields that the real parser can consume', (mode) => {
    const template = read(`${prefix}/references/${mode}-review.md`);
    const body = template.split('```md\n')[1].split('\n```')[0];
    const items = body.match(/^- \[F-\d{3}\][^\n]*\n(?:[ \t]+-[^\n]*\n?)+/gmu)!;
    expect(items).toHaveLength(mode === 'fix' ? 4 : 3);
    for (const item of items) {
      expect(item.match(/  - 问题来源 \/ Origin：/gu)).toHaveLength(1);
      expect(item.match(/  - 复现观测 \/ Reproduction：/gu)).toHaveLength(1);
    }
    // Instantiate a Risk finding using the generated field labels; check behavior, not just heading presence.
    const original = readText('evaluation/prototypes/origin-occurrence/examples/quick.en.md');
    const fields = body.match(/  - 问题来源 \/ Origin：[^\n]*\n  - 复现观测 \/ Reproduction：[^\n]*/u)![0]
      .replace(/：New \/ Amplified \/ Retained \/ Unknown - .*/u, '：New - the declared baseline has the guard.')
      .replace(/：Observed \/ Not Run \/ Cannot Verify \/ Not Applicable - .*/u, '：Not Run - no execution record supplied.');
    const report = original.replace(/^  - Origin:.*\n  - Reproduction:.*$/mu, fields);
    expect(validateOriginOccurrenceIntegrated(report, 'quick').candidate.structurallyValid).toBe(true);
  });

  test.each(['quick.en.md', 'quick.zh-CN.md', 'deep.en.md', 'deep.zh-CN.md', 'fix.en.md', 'fix.zh-CN.md'])('%s is a complete authored example accepted through the selected CLI and evaluator', (name) => {
    const definition = JSON.parse(read('examples/oracles.json')).examples[name];
    const report = read(`examples/${name}`);
    const result = evaluateIntegratedOriginOccurrenceReport(report, definition.mode, definition.oracle, { sourceRoot: '/review' });
    expect(result.adjudication.status).toBe('Pass');
    expect(result.reportAcceptance).toBe('Not Evaluated');
    expect(report).toMatch(/authored format illustration|人工编写的格式示例/u);
    if (name.endsWith('.en.md') && definition.mode !== 'fix') expect(result.raw.structurallyValid).toBe(false);
    const cli = spawnSync(process.execPath, ['scripts/validate-origin-occurrence-integrated.mjs', '--profile', 'integration-11', '--mode', definition.mode, '--source-root', '/review', path.join(output, 'examples', name)], { cwd: rootDir, encoding: 'utf8' });
    expect(cli.status, cli.stderr).toBe(0);
    expect(JSON.parse(cli.stdout).candidate.structurallyValid).toBe(true);
  });

  test('freezes source/output hashes and byte deltas, builds deterministically and refuses overwrite', () => {
    for (const input of manifest.inputs) expect(hash(readHistoricalText(input.path)), input.path).toBe(input.sha256);
    for (const target of manifest.outputs) {
      expect(hash(read(target.path)), target.path).toBe(target.sha256);
      expect(Buffer.byteLength(read(target.path))).toBe(target.bytes);
    }
    for (const delta of manifest.deltas) expect(delta.after - delta.before).toBe(delta.delta);
    const second = buildOriginOccurrenceIntegrated(path.join(temporary, 'second'));
    expect(second).toEqual(manifest);
    expect(() => buildOriginOccurrenceIntegrated(output)).toThrow(/never overwritten/);
  });
});

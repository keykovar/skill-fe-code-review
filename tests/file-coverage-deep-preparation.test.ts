import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { buildFileCoverageSkill } from '../evaluation/prototypes/build-file-coverage-skill.mjs';
import { prepareFileCoverageComparison } from '../evaluation/prototypes/prepare-file-coverage-comparison.mjs';
import { prepareFileCoverageDeep, verifyFileCoverageDeep } from '../evaluation/prototypes/prepare-file-coverage-deep.mjs';
import { verifyBoundedReadDelivery } from '../evaluation/prototypes/prepare-file-coverage-quick-replacement.mjs';

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fe-file-coverage-deep-')));
const candidate = buildFileCoverageSkill(path.join(root, 'candidate'));
const parent = prepareFileCoverageComparison({ output: path.join(root, 'parent'), candidateBundle: candidate.output });
const prepared = prepareFileCoverageDeep({ output: path.join(root, 'deep'), previousMaterials: parent.output, previousFreezeSha256: parent.freezeSha256 });
const read = (relative: string) => fs.readFileSync(path.join(prepared.output, relative), 'utf8');
const json = (relative: string) => JSON.parse(read(relative));
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('file-coverage Deep bounded preparation', () => {
  test('freezes only the candidate/stable Deep pair without runtime authorization', () => {
    expect(verifyFileCoverageDeep(prepared.output, prepared.freezeSha256, parent.output)).toMatchObject({
      status: 'Offline Pass', runs: 2, executionAuthorized: false, modelInvocations: 0, runtimeDelivery: 'Not Evaluated',
    });
    expect(prepared.manifest.runs.map((run: any) => [run.id, run.variant, run.status])).toEqual([
      ['03-deep-candidate', 'candidate', 'Not Run'], ['04-deep-stable', 'stable', 'Not Run'],
    ]);
    expect(json('control/plan.json')).toMatchObject({
      window: 'file-coverage-comparison-03b', maxSourceBearingRuns: 2, executionAuthorized: false, runtimeReady: false,
    });
    expect(read('control/launch.md')).toContain('本次唯一工作目录：');
    expect(read('control/launch.md')).toContain('执行一次 Deep Review');
  });

  test('keeps the Deep packet and selected instructions identical across the pair', () => {
    const [candidateRun, stableRun] = prepared.manifest.runs;
    expect(candidateRun.filePins.map((pin: any) => pin.path)).toEqual(stableRun.filePins.map((pin: any) => pin.path));
    expect(candidateRun.bootstrapSha256).toBe(stableRun.bootstrapSha256);
    for (const run of prepared.manifest.runs) {
      const material = JSON.parse(read(`${run.workspace}/materials.json`));
      expect(material.mode).toBe('deep');
      expect(material.files.some((pin: any) => /oracle|plan|history|report/u.test(pin.path))).toBe(false);
      expect(material.files.filter((pin: any) => pin.delivery !== 'startup').every((pin: any) => Array.isArray(pin.readRanges))).toBe(true);
      expect(read(`${run.workspace}/bootstrap.md`)).toContain('外层工具输出预算也至少 20000 tokens');
    }
  });

  test('uses complete contiguous bounded reads and the same schedule for both variants', () => {
    const [candidateRun, stableRun] = prepared.manifest.runs;
    expect(candidateRun.reads.length).toBe(stableRun.reads.length);
    expect(candidateRun.reads[0].path).toBe('materials.json');
    for (const run of prepared.manifest.runs) {
      expect(run.reads.every((pin: any) => pin.bytes <= 20000)).toBe(true);
      for (const pin of run.filePins.filter((item: any) => item.readRanges)) {
        const content = fs.readFileSync(path.join(prepared.output, run.workspace, pin.path), 'utf8');
        const lines = content.match(/[^\n]*\n|[^\n]+$/gu) ?? [];
        let next = 1;
        let reconstructed = '';
        for (const [start, end] of pin.readRanges) {
          expect(start).toBe(next);
          const output = lines.slice(start - 1, end).join('');
          expect(Buffer.byteLength(output)).toBeLessThanOrEqual(6000);
          reconstructed += output;
          next = end + 1;
        }
        expect(next).toBe(lines.length + 1);
        expect(reconstructed).toBe(content);
      }
    }
  });

  test.each(['missing', 'reorder', 'truncate', 'extra'] as const)('rejects %s read receipt drift', kind => {
    const run = prepared.manifest.runs[0];
    const actual = run.reads.map((pin: any) => {
      const content = fs.readFileSync(path.join(prepared.output, run.workspace, pin.path), 'utf8');
      const lines = content.match(/[^\n]*\n|[^\n]+$/gu) ?? [];
      return { id: pin.id, output: pin.path === 'materials.json' ? content : lines.slice(pin.start - 1, pin.end).join('') };
    });
    if (kind === 'missing') actual.pop();
    if (kind === 'reorder') [actual[1], actual[2]] = [actual[2], actual[1]];
    if (kind === 'truncate') actual[2].output = actual[2].output.slice(0, -1);
    if (kind === 'extra') actual.push(actual[0]);
    expect(() => verifyBoundedReadDelivery(run.reads, actual)).toThrow();
  });

  test.each(['control', 'source', 'extra', 'symlink'] as const)('rejects %s post-freeze drift', kind => {
    const copy = path.join(root, `changed-${kind}`);
    fs.cpSync(prepared.output, copy, { recursive: true });
    const target = path.join(copy, prepared.manifest.runs[0].workspace, 'packet/after/src/url.mjs');
    if (kind === 'control') fs.appendFileSync(path.join(copy, 'control/plan.json'), '\n');
    if (kind === 'source') fs.appendFileSync(target, '\nchanged\n');
    if (kind === 'extra') fs.writeFileSync(path.join(copy, prepared.manifest.runs[0].workspace, 'extra.txt'), 'unexpected');
    if (kind === 'symlink') {
      const skillTarget = path.join(copy, prepared.manifest.runs[0].workspace, 'skill/SKILL.md');
      fs.unlinkSync(skillTarget);
      fs.symlinkSync(skillTarget + '.missing', skillTarget);
    }
    expect(() => verifyFileCoverageDeep(copy, prepared.freezeSha256, parent.output)).toThrow();
  });

  test('rejects missing or changed independent freeze digest and unsafe destinations', () => {
    expect(() => verifyFileCoverageDeep(prepared.output, undefined, parent.output)).toThrow('digest');
    expect(() => verifyFileCoverageDeep(prepared.output, '0'.repeat(64), parent.output)).toThrow('digest');
    expect(() => prepareFileCoverageDeep({ output: prepared.output, previousMaterials: parent.output, previousFreezeSha256: parent.freezeSha256 })).toThrow('already exists');
    expect(() => prepareFileCoverageDeep({ output: path.join(parent.output, 'nested'), previousMaterials: parent.output, previousFreezeSha256: parent.freezeSha256 })).toThrow('overlaps');
  });
});

import { describe, expect, test } from 'vitest';
import { buildBoundedReviewMaterials, verifyBoundedReviewMaterials } from '../evaluation/prototypes/bounded-review-materials.mjs';
import { clarifyLedgerCore, clarifyLedgerReference } from '../evaluation/prototypes/build-ledger-format-skill.mjs';
import { fileCoverageRuntimeFixtures } from '../evaluation/prototypes/file-coverage/runtime-fixtures.mjs';
import { readText } from './test-utils';

function materials(candidate: boolean) {
  const fixture = fileCoverageRuntimeFixtures()[0];
  const core = readText('skills/fe-code-review/SKILL.md');
  const quick = readText('skills/fe-code-review/references/quick-review.md');
  return [
    { path: 'skill/SKILL.md', text: candidate ? clarifyLedgerCore(core) : core },
    { path: 'skill/references/quick-review.md', text: candidate ? clarifyLedgerReference(quick) : quick },
    { path: 'skill/references/javascript.md', text: readText('skills/fe-code-review/references/javascript.md') },
    { path: 'packet/packet.json', text: JSON.stringify(fixture.packet, null, 2) + '\n' },
    { path: 'packet/context.md', text: fixture.files['context.md'] },
    ...Object.entries(fixture.files).filter(([name]) => name !== 'context.md').map(([name, text]) => ({ path: 'packet/' + name, text })),
  ];
}

describe('bounded verbatim review material batches', () => {
  test.each([false, true])('reconstructs all selected instructions and public sources, candidate=%s', candidate => {
    const input = materials(candidate);
    const bundle = buildBoundedReviewMaterials(input);
    expect(verifyBoundedReviewMaterials(bundle, bundle.batches.map(batch => batch.text))).toMatchObject({ status: 'Pass', files: 15, semanticStatus: 'Not Evaluated' });
    expect(bundle.batches.length).toBeLessThan(5);
    expect(bundle.batches.every(batch => batch.bytes <= 20000)).toBe(true);
    expect(bundle.files.map(file => file.path)).toEqual(input.map(file => file.path));
    expect(bundle.files.some(file => /oracle|control|report|history/u.test(file.path))).toBe(false);
    const output = new Map(input.map(file => [file.path, '']));
    for (const batch of bundle.batches) for (const segment of JSON.parse(batch.text).segments) output.set(segment.path, output.get(segment.path)! + segment.content);
    for (const file of input) expect(output.get(file.path)).toBe(file.text);
  });

  test('keeps original and format-only candidate batch counts equal without repeating content', () => {
    const a = buildBoundedReviewMaterials(materials(false));
    const b = buildBoundedReviewMaterials(materials(true));
    expect(a.batches.length).toBe(b.batches.length);
    expect(a.files.filter(file => file.path.startsWith('packet/'))).toEqual(b.files.filter(file => file.path.startsWith('packet/')));
    expect(b.runtimeDelivery).toBe('Not Evaluated');
  });

  test('bounds encoded payload including escaping, Unicode, CRLF and missing final newline', () => {
    const text = ('"quote" \\ 中文\r\n').repeat(3000) + '末行';
    const bundle = buildBoundedReviewMaterials([{ path: 'src/中文 text.js', text }]);
    expect(bundle.batches.every(batch => Buffer.byteLength(batch.text) <= 20000)).toBe(true);
    expect(verifyBoundedReviewMaterials(bundle, bundle.batches.map(batch => batch.text)).status).toBe('Pass');
  });

  test.each(['missing', 'extra', 'reorder', 'truncate', 'same-length-change', 'wrapped', 'unknown-source-pin'] as const)('rejects %s receipt drift', kind => {
    const bundle = buildBoundedReviewMaterials(materials(true));
    const outputs = bundle.batches.map(batch => batch.text);
    if (kind === 'missing') outputs.pop();
    if (kind === 'extra') outputs.push(outputs[0]);
    if (kind === 'reorder') [outputs[0], outputs[1]] = [outputs[1], outputs[0]];
    if (kind === 'truncate') outputs[0] = outputs[0].slice(0, -40);
    if (kind === 'same-length-change') outputs[0] = outputs[0].replace('verbatim', 'VERBATIM');
    if (kind === 'wrapped') outputs[0] = JSON.stringify(outputs[0]);
    if (kind === 'unknown-source-pin') bundle.files[0].path = 'other/SKILL.md';
    expect(() => verifyBoundedReviewMaterials(bundle, outputs)).toThrow();
  });

  test.each(['../secret', '/absolute', 'a//b', 'a/./b', 'a\\b', 'a\u0000b'])('rejects noncanonical source identity %j', name => {
    expect(() => buildBoundedReviewMaterials([{ path: name, text: 'content\n' }])).toThrow('path');
  });

  test('rejects duplicate, invalid UTF-8, empty and oversized-line inputs before producing a bundle', () => {
    expect(() => buildBoundedReviewMaterials([])).toThrow('non-empty');
    expect(() => buildBoundedReviewMaterials([{ path: 'x', text: '' }])).toThrow('Non-empty');
    expect(() => buildBoundedReviewMaterials([{ path: 'x', text: '\ud800' }])).toThrow('well-formed');
    expect(() => buildBoundedReviewMaterials([{ path: 'x', text: 'x' }, { path: 'x', text: 'x' }])).toThrow('duplicate');
    expect(() => buildBoundedReviewMaterials([{ path: 'x', text: 'x'.repeat(20000) }])).toThrow('physical line');
  });
});

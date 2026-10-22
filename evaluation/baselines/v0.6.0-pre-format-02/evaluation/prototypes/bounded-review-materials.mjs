import { createHash } from 'node:crypto';

const maxPayloadBytes = 20000;
const sha256 = text => createHash('sha256').update(text).digest('hex');
const encode = segments => JSON.stringify({ kind: 'verbatim-review-materials', segments }, null, 2) + '\n';
const physicalLines = text => text.match(/[^\n]*\n|[^\n]+$/gu) ?? [];

function canonical(name) {
  return typeof name === 'string' && name && !name.startsWith('/') &&
    !name.includes('\\') && !/[\x00-\x1f\x7f]/u.test(name) &&
    !name.split('/').some(part => !part || part === '.' || part === '..');
}

// Materialize exact source text so reviewers only need bounded read-only cat calls.
export function buildBoundedReviewMaterials(files) {
  if (!Array.isArray(files) || !files.length) throw new Error('Explicit non-empty material list required.');
  const names = new Set();
  const batches = [];
  const filePins = [];
  let segments = [];
  const flush = () => {
    if (!segments.length) return;
    const text = encode(segments);
    batches.push({ path: `batches/${String(batches.length + 1).padStart(2, '0')}.json`, text,
      bytes: Buffer.byteLength(text), sha256: sha256(text) });
    segments = [];
  };
  for (const file of files) {
    if (!canonical(file.path) || names.has(file.path)) throw new Error('Invalid or duplicate material path.');
    if (typeof file.text !== 'string' || !file.text || !file.text.isWellFormed()) throw new Error('Non-empty well-formed UTF-8 text required.');
    names.add(file.path);
    filePins.push({ path: file.path, bytes: Buffer.byteLength(file.text), sha256: sha256(file.text) });
    for (const [index, line] of physicalLines(file.text).entries()) {
      const current = segments.at(-1);
      const extend = current?.path === file.path;
      const next = extend
        ? [...segments.slice(0, -1), { ...current, end: index + 1, content: current.content + line }]
        : [...segments, { path: file.path, start: index + 1, end: index + 1, content: line }];
      if (Buffer.byteLength(encode(next)) <= maxPayloadBytes) segments = next;
      else {
        flush();
        segments = [{ path: file.path, start: index + 1, end: index + 1, content: line }];
        if (Buffer.byteLength(encode(segments)) > maxPayloadBytes) throw new Error('One physical line exceeds the encoded batch limit.');
      }
    }
  }
  flush();
  return { files: filePins, batches, maxPayloadBytes, runtimeDelivery: 'Not Evaluated' };
}

export function verifyBoundedReviewMaterials(bundle, outputs) {
  if (!Array.isArray(outputs) || outputs.length !== bundle.batches.length) throw new Error('Missing or extra batch outputs.');
  const reconstructed = new Map(bundle.files.map(pin => [pin.path, { text: '', next: 1 }]));
  for (const [index, output] of outputs.entries()) {
    const expected = bundle.batches[index];
    if (typeof output !== 'string' || Buffer.byteLength(output) !== expected.bytes || sha256(output) !== expected.sha256) throw new Error('Model-visible batch bytes do not match.');
    const packet = JSON.parse(output);
    if (packet.kind !== 'verbatim-review-materials') throw new Error('Unexpected batch kind.');
    for (const segment of packet.segments) {
      const file = reconstructed.get(segment.path);
      if (!file || segment.start !== file.next || segment.end < segment.start ||
        physicalLines(segment.content).length !== segment.end - segment.start + 1) throw new Error('Missing, duplicate or invalid line range.');
      file.text += segment.content;
      file.next = segment.end + 1;
    }
  }
  for (const pin of bundle.files) {
    const text = reconstructed.get(pin.path).text;
    if (Buffer.byteLength(text) !== pin.bytes || sha256(text) !== pin.sha256) throw new Error('Reconstructed file differs from frozen source.');
  }
  return { status: 'Pass', files: bundle.files.length, batches: bundle.batches.length, semanticStatus: 'Not Evaluated',
    limitation: 'Requires independently frozen pins and actual model-visible outputs. Local reconstruction is not runtime delivery, semantic or isolation evidence.' };
}

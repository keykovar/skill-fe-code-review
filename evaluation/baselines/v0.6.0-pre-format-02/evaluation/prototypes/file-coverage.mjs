// Evaluator-only accounting. This module never reads files or invokes Git.
const states = ['Reviewed', 'Partial', 'Deferred', 'Cannot Verify'];
const layers = ['staged', 'unstaged', 'untracked'];
const conflicts = new Set(['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU']);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const filePath = (value) => typeof value === 'string' && value.length > 0 &&
  !value.includes('\0') && !value.startsWith('/') && !/^[A-Za-z]:[\\/]/u.test(value) &&
  value.split('/').every((part) => part !== '' && part !== '.' && part !== '..');
const layerList = (value) => Array.isArray(value) && new Set(value).size === value.length &&
  value.every((layer) => layers.includes(layer));

export function parseGitStatusInventory(raw, { scopeKey, baseline, enumerationComplete } = {}) {
  if (!text(scopeKey) || typeof enumerationComplete !== 'boolean' ||
      !(baseline === null || text(baseline))) {
    throw new TypeError('Explicit scopeKey, baseline (or null), and enumerationComplete are required.');
  }
  const files = [];
  const issues = [];
  const addIssue = (code) => { if (!issues.includes(code)) issues.push(code); };
  const result = () => ({ scopeKey, baseline, complete: issues.length === 0, issues, files });
  if (!enumerationComplete) addIssue('enumeration-incomplete');
  if (baseline === null) addIssue('baseline-unavailable');
  let source;
  try {
    if (typeof raw === 'string') {
      if (!raw.isWellFormed()) throw new Error('Invalid text');
      source = raw;
    } else if (raw instanceof Uint8Array) {
      source = new TextDecoder('utf-8', { fatal: true }).decode(raw);
    } else throw new Error('Unsupported input');
  } catch {
    addIssue('invalid-status-encoding');
    return result();
  }
  const records = source.split('\0');
  if (records.pop() !== '') addIssue('unterminated-status');
  const seen = new Set();
  for (let index = 0; index < records.length; index++) {
    const record = records[index];
    const xy = record.slice(0, 2);
    if (record.length < 4 || record[2] !== ' ' ||
        !(xy === '??' || (/^[ MADRCUT]{2}$/u.test(xy) && xy !== '  '))) {
      addIssue('invalid-status-record');
      continue;
    }
    const currentPath = record.slice(3);
    let oldPath;
    if (/[RC]/u.test(xy)) {
      // Porcelain v1 -z emits the destination first, then the original name.
      oldPath = records[++index];
      if (oldPath === undefined) { addIssue('missing-original-path'); break; }
    }
    if (!filePath(currentPath) || (oldPath !== undefined && !filePath(oldPath))) {
      addIssue('invalid-path');
      continue;
    }
    if (seen.has(currentPath)) { addIssue('duplicate-path'); continue; }
    seen.add(currentPath);
    if (conflicts.has(xy)) addIssue('unmerged-status');
    if (/[RC]/u.test(xy[0]) && /[RC]/u.test(xy[1])) addIssue('ambiguous-rename-layers');
    files.push({
      path: currentPath,
      ...(oldPath === undefined ? {} : { oldPath }),
      status: xy,
      layers: xy === '??' ? ['untracked'] : [
        ...(xy[0] === ' ' ? [] : ['staged']),
        ...(xy[1] === ' ' ? [] : ['unstaged']),
      ],
    });
  }
  return result();
}

export function validateFileCoverage(inventory, draft) {
  const errors = [];
  const fail = (code, path) => errors.push(path === undefined ? { code } : { code, path });
  const finish = () => ({ valid: errors.length === 0, errors });
  if (!object(inventory) || !text(inventory.scopeKey) ||
      !(inventory.baseline === null || text(inventory.baseline)) ||
      typeof inventory.complete !== 'boolean' || !Array.isArray(inventory.issues) ||
      !inventory.issues.every(text) || !Array.isArray(inventory.files)) {
    fail('invalid-inventory');
    return finish();
  }
  if (inventory.complete !== (inventory.issues.length === 0) ||
      (inventory.baseline === null && inventory.complete)) fail('invalid-inventory-completeness');
  const expected = new Map();
  for (const file of inventory.files) {
    if (!object(file) || !filePath(file.path) ||
        (file.oldPath !== undefined && !filePath(file.oldPath)) ||
        !layerList(file.layers) || file.layers.length === 0) {
      fail('invalid-inventory-file');
      continue;
    }
    if (expected.has(file.path)) fail('duplicate-inventory-path', file.path);
    expected.set(file.path, file);
  }
  if (errors.length) return finish();
  if (!object(draft)) { fail('invalid-draft'); return finish(); }
  if (draft.mode === 'fix') { fail('fix-coverage-forbidden'); return finish(); }
  if (!['quick', 'deep'].includes(draft.mode)) fail('invalid-mode');
  if (draft.scopeKey !== inventory.scopeKey || draft.baseline !== inventory.baseline) fail('comparison-mismatch');
  if (!Array.isArray(draft.entries) || !object(draft.summary)) {
    fail('invalid-draft-shape');
    return finish();
  }
  const seen = new Set();
  const counts = Object.fromEntries(states.map((state) => [state, 0]));
  for (const entry of draft.entries) {
    if (!object(entry) || !filePath(entry.path)) { fail('invalid-entry'); continue; }
    const file = expected.get(entry.path);
    if (!file) { fail('out-of-scope-path', entry.path); continue; }
    if (seen.has(entry.path)) { fail('duplicate-entry', entry.path); continue; }
    seen.add(entry.path);
    if (!states.includes(entry.state)) { fail('invalid-state', entry.path); continue; }
    counts[entry.state]++;
    if (!layerList(entry.reviewedLayers) || entry.reviewedLayers.some((layer) => !file.layers.includes(layer))) {
      fail('invalid-reviewed-layers', entry.path);
      continue;
    }
    if (entry.state === 'Reviewed') {
      if (inventory.baseline === null || entry.reviewedLayers.length !== file.layers.length ||
          !text(entry.evidence) || text(entry.remaining)) fail('unsupported-reviewed', entry.path);
    } else {
      if (!text(entry.remaining)) fail('missing-gap-reason', entry.path);
      if (entry.state === 'Partial' && !text(entry.evidence)) fail('missing-partial-evidence', entry.path);
      if (entry.state === 'Deferred' && entry.reviewedLayers.length) fail('deferred-after-review', entry.path);
    }
  }
  for (const name of expected.keys()) if (!seen.has(name)) fail('missing-entry', name);
  const summary = draft.summary;
  if (summary.inventory !== (inventory.complete ? 'Complete' : 'Incomplete')) fail('inventory-state-mismatch');
  if (summary.knownFiles !== expected.size) fail('known-count-mismatch');
  if (summary.totalFiles !== (inventory.complete ? expected.size : null)) fail('total-count-mismatch');
  if (!object(summary.counts) || Object.keys(summary.counts).length !== states.length ||
      states.some((state) => !Number.isSafeInteger(summary.counts[state]) ||
        summary.counts[state] < 0 || summary.counts[state] !== counts[state])) fail('state-count-mismatch');
  const fullyReviewed = inventory.complete && seen.size === expected.size && counts.Reviewed === expected.size;
  if (summary.fullyReviewed !== fullyReviewed) fail('full-coverage-mismatch');
  if (!inventory.complete && !text(summary.inventoryGap)) fail('missing-inventory-gap');
  return finish();
}

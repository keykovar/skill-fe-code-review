import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const preFormatRoot = fileURLToPath(new URL('../evaluation/baselines/v0.6.0-pre-format-02', import.meta.url));
const manifestSha256 = '8786bffcb36d65297c178cc47390f5b778f175b0db182584d9ba79bf568153d9';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function verifyPreFormatBaseline(root = preFormatRoot) {
  const manifestBytes = fs.readFileSync(path.join(root, 'manifest.json'));
  assert.equal(sha256(manifestBytes), manifestSha256, 'Historical baseline manifest changed.');
  const manifest = JSON.parse(manifestBytes);
  const actual = [];
  const walk = (relative = '') => {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const name = relative ? relative + '/' + entry.name : entry.name;
      if (entry.isDirectory()) walk(name);
      else {
        assert(entry.isFile(), 'Historical baseline contains a non-regular file: ' + name);
        if (!['manifest.json', 'README.md'].includes(name)) actual.push(name);
      }
    }
  };
  walk();
  assert.deepEqual(actual.sort(), manifest.files.map(pin => pin.path).sort(), 'Historical baseline inventory changed.');
  for (const pin of manifest.files) {
    const bytes = fs.readFileSync(path.join(root, pin.path));
    assert.equal(bytes.length, pin.bytes, 'Historical baseline size changed: ' + pin.path);
    assert.equal(sha256(bytes), pin.sha256, 'Historical baseline digest changed: ' + pin.path);
  }
  return manifest;
}

export const preFormatSuites = verifyPreFormatBaseline().tests;

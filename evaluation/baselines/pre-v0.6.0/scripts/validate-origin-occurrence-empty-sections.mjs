#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateOriginOccurrenceIntegrated } from './validate-origin-occurrence-integrated.mjs';

const marker = /^(?:-[ \t]+)?(无明确问题。|No clear issue\.)[ \t]*$/u;
const severityHeading = /^(Blocking(?:：必须修改)?|Risk(?:：建议修改)?|Improve(?:：可优化)?)$/u;
const findingsHeading = /^(Findings(?:：问题列表)?|问题列表)$/u;
const regressionHeading = /^(New Regression(?:：新增回归)?|新增回归)$/u;

function emptySectionView(markdown, mode) {
  const lines = markdown.replace(/\r\n?/gu, '\n').split('\n');
  const projected = [...lines];
  const mappings = [];
  const errors = [];
  let topHeading = '';
  let section = null;
  let fence = null;

  const finish = () => {
    if (!section?.markers.length) return;
    if (!section.eligible) {
      errors.push({ line: section.start + 1, type: 'empty-marker-section-unsupported' });
    } else if (section.content.length !== 1 || section.markers.length !== 1) {
      errors.push({ line: section.start + 1, type: 'empty-marker-mixed-or-duplicate-content' });
    } else {
      const index = section.markers[0];
      if (lines[index].startsWith('-')) {
        projected[index] = lines[index].match(marker)[1];
        mappings.push({ line: index + 1, original: lines[index], normalized: projected[index] });
      }
    }
  };

  for (const [index, line] of lines.entries()) {
    const delimiter = line.match(/^\s*(`{3,}|~{3,})/u)?.[1];
    if (delimiter || fence) {
      // Fenced text is never a marker; it still makes an otherwise empty section non-empty.
      if (section && line.trim()) section.content.push(index);
      if (delimiter) {
        if (!fence) fence = delimiter;
        else if (delimiter[0] === fence[0] && delimiter.length >= fence.length) fence = null;
      }
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/u);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2].replace(/\s+#+$/u, '');
      if (section && level <= section.level) { finish(); section = null; }
      if (level <= 2) topHeading = level === 2 ? title : '';
      if (section) {
        section.content.push(index);
      } else if (severityHeading.test(title)) {
        const eligible = mode === 'quick' ? level === 2 : level === 3 &&
          (mode === 'deep' ? findingsHeading : regressionHeading).test(topHeading);
        section = { start: index, level, eligible, markers: [], content: [] };
      }
      continue;
    }
    if (section && line.trim()) {
      section.content.push(index);
      if (marker.test(line)) section.markers.push(index);
    }
  }
  finish();
  return { markdown: projected.join('\n'), mappings, errors };
}

// Explicit offline revision: construct one checked presentation view, never rewrite the report.
export function validateOriginOccurrenceEmptySections(markdown, mode, options = {}) {
  const original = validateOriginOccurrenceIntegrated(markdown, mode, options);
  const view = emptySectionView(markdown, mode);
  const selected = view.mappings.length
    ? validateOriginOccurrenceIntegrated(view.markdown, mode, options) : original;
  const candidate = { ...selected.candidate,
    structurallyValid: selected.candidate.structurallyValid && !view.errors.length,
    errors: [...selected.candidate.errors, ...view.errors],
  };
  return {
    ...selected, profile: 'integration-12', raw: original.raw, candidate,
    previousValidation: original,
    compatibility: { ...selected.compatibility, emptySections: {
      status: view.errors.length ? 'Fail' : view.mappings.length ? 'Applied' : 'Not Applied',
      mappings: view.mappings, errors: view.errors,
    } },
    reportAcceptance: 'Not Evaluated',
    limitation: `${selected.limitation} Empty-section compatibility checks exact standalone markers only; mixed or duplicate content stays invalid. It does not establish supported-condition coverage or recommendation consistency.`,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const [flag, profile, modeFlag, mode, ...rest] = process.argv.slice(2);
    const linked = rest[0] === '--source-root';
    const filename = rest[linked ? 2 : 0];
    if (flag !== '--profile' || profile !== 'integration-12' || modeFlag !== '--mode' ||
      rest.length !== (linked ? 3 : 1) || !filename || filename.startsWith('--')) {
      throw new Error('Usage: node scripts/validate-origin-occurrence-empty-sections.mjs --profile integration-12 --mode <quick|deep|fix> [--source-root <root>] <review.md>');
    }
    const result = validateOriginOccurrenceEmptySections(fs.readFileSync(path.resolve(filename), 'utf8'), mode,
      linked ? { sourceRoot: rest[1] } : {});
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.candidate.structurallyValid ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}

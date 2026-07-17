import { describe, expect, test } from 'vitest';

import { exists, readText, skillMd } from './test-utils';

const references = [
  'react.md',
  'vue.md',
  'typescript.md',
  'javascript.md',
  'hybrid-webview.md',
  'release-risk.md',
];

const modeReferences = ['quick-review.md', 'deep-review.md', 'fix-review.md'];

describe('references', () => {
  test('all referenced files exist and are mentioned by SKILL.md', () => {
    for (const reference of references) {
      expect(exists(`skills/fe-code-review/references/${reference}`)).toBe(true);
      expect(skillMd).toContain(reference);
    }
  });

  test('reference files contain focused review guidance', () => {
    for (const reference of references) {
      const content = readText(`skills/fe-code-review/references/${reference}`);

      expect(content).toContain('Review Focus');
      expect(content).toContain('Common Findings');
      expect(content).toContain('Evidence To Collect');
    }
  });

  test('mode references contain localized output templates', () => {
    for (const reference of modeReferences) {
      expect(exists(`skills/fe-code-review/references/${reference}`)).toBe(true);
      expect(skillMd).toContain(reference);

      const content = readText(`skills/fe-code-review/references/${reference}`);

      expect(content).toContain('## Chinese Output Template');
      expect(content).toContain('## English Output Template');
    }
  });
});

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

import { exists, parseFrontmatter, skillDir, skillMd } from './test-utils';

describe('skill structure', () => {
  test('has required skill files', () => {
    expect(exists('skills/fe-code-review/SKILL.md')).toBe(true);
    expect(exists('skills/fe-code-review/agents/openai.yaml')).toBe(true);
    expect(exists('skills/fe-code-review/references/react.md')).toBe(true);
    expect(exists('skills/fe-code-review/references/vue.md')).toBe(true);
    expect(exists('skills/fe-code-review/references/typescript.md')).toBe(true);
    expect(exists('skills/fe-code-review/references/javascript.md')).toBe(true);
    expect(exists('skills/fe-code-review/references/hybrid-webview.md')).toBe(true);
    expect(exists('skills/fe-code-review/references/release-risk.md')).toBe(true);
    expect(exists('skills/fe-code-review/references/quick-review.md')).toBe(true);
    expect(exists('skills/fe-code-review/references/deep-review.md')).toBe(true);
    expect(exists('skills/fe-code-review/references/fix-review.md')).toBe(true);
  });

  test('has valid core frontmatter', () => {
    const frontmatter = parseFrontmatter(skillMd);

    expect(frontmatter.name).toBe('fe-code-review');
    expect(frontmatter.description).toContain('Review frontend or hybrid app code changes');
    expect(frontmatter.description).toContain('Quick Review');
    expect(frontmatter.description).toContain('Deep Review');
    expect(frontmatter.description).toContain('Fix Review');
  });

  test('does not include documentation noise inside the skill directory', () => {
    const forbidden = ['README.md', 'CHANGELOG.md', 'INSTALLATION_GUIDE.md', 'QUICK_REFERENCE.md'];

    for (const file of forbidden) {
      expect(fs.existsSync(path.join(skillDir, file))).toBe(false);
    }
  });
});

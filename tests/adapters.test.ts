import { describe, expect, test } from 'vitest';

import { exists, parseFrontmatter, readText } from './test-utils';

describe('adapters', () => {
  test('includes documentation for each supported agent surface', () => {
    expect(exists('adapters/codex/README.md')).toBe(true);
    expect(exists('adapters/claude-code/README.md')).toBe(true);
    expect(exists('adapters/cursor/README.md')).toBe(true);
  });

  test('cursor rule is thin and valid', () => {
    const rule = readText('adapters/cursor/rules/fe-code-review.mdc');
    const frontmatter = parseFrontmatter(rule);

    expect(frontmatter.description).toContain('frontend or hybrid app code review');
    expect(frontmatter.description).toContain('Fix Review');
    expect(frontmatter.alwaysApply).toBe('false');
    expect(rule).toContain('use the `fe-code-review` skill');
    expect(rule).toContain('Return the review in chat');
    expect(rule).toContain('Cursor Agent or Build mode does not change that boundary');
    expect(rule.length).toBeLessThan(1000);
  });

  test('claude example imports AGENTS.md instead of duplicating the full skill', () => {
    const example = readText('adapters/claude-code/CLAUDE.md.example');

    expect(example).toContain('@AGENTS.md');
    expect(example).toContain('/fe-code-review');
    expect(example).not.toContain('## Quick Review');
    expect(example).not.toContain('## Deep Review');
  });
});

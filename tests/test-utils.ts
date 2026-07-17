import fs from 'node:fs';
import path from 'node:path';

export const rootDir = process.cwd();
export const skillDir = path.join(rootDir, 'skills', 'fe-code-review');
export const skillPath = path.join(skillDir, 'SKILL.md');
export const skillMd = fs.readFileSync(skillPath, 'utf8');

export function readText(relativePath: string): string {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

export function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(rootDir, relativePath));
}

export function parseFrontmatter(markdown: string): Record<string, string> {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error('Missing frontmatter');
  }

  return Object.fromEntries(
    match[1]
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf(':');
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim().replace(/^"|"$/g, '')];
      }),
  );
}

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { rootDir } from './test-utils';

interface AuditResult {
  toolCallCount: number;
  valid: boolean;
  violations: Array<{ type: string }>;
}

const temporaryDirectories: string[] = [];
const auditScript = path.join(rootDir, 'scripts', 'audit-runtime-trace.mjs');

function makeWorkspace(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-code-review-trace-test-'));
  temporaryDirectories.push(directory);
  return directory;
}

function writeTrace(directory: string, events: unknown[]): string {
  const tracePath = path.join(directory, 'trace.jsonl');
  fs.writeFileSync(tracePath, `${events.map((event) => JSON.stringify(event)).join('\n')}\n`);
  return tracePath;
}

function toolEvent(toolCall: Record<string, unknown>) {
  return {
    subtype: 'started',
    tool_call: toolCall,
    type: 'tool_call',
  };
}

function audit(workspace: string, tracePath: string, includePnpmSeparator = false) {
  return spawnSync(
    process.execPath,
    [auditScript, ...(includePnpmSeparator ? ['--'] : []), '--workspace', workspace, tracePath],
    { encoding: 'utf8' },
  );
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('runtime evaluation trace audit', () => {
  test('accepts workspace-scoped reads and read-only Git commands', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      toolEvent({ readToolCall: { args: { path: path.join(workspace, 'src/url.ts') } } }),
      toolEvent({
        shellToolCall: {
          args: {
            command:
              `git merge-base main HEAD && cat "${path.join(workspace, 'src/url.ts')}" && npm test 2>&1; ls missing 2>/dev/null || true; node <<'EOF'\nconst path = '/users/42';\nconsole.log(path, '=>');\nEOF`,
            workingDirectory: workspace,
          },
        },
      }),
    ]);

    const result = audit(workspace, tracePath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status, result.stderr).toBe(0);
    expect(report.valid).toBe(true);
    expect(report.toolCallCount).toBe(2);
    expect(report.violations).toEqual([]);
  });

  test('accepts the argument separator forwarded by pnpm', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, []);
    const result = audit(workspace, tracePath, true);

    expect(result.status, result.stderr).toBe(0);
  });

  test('rejects reads outside the fixture and direct oracle access', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      toolEvent({ readToolCall: { args: { path: '/private/tmp/other/source.ts' } } }),
      toolEvent({
        readToolCall: {
          args: { path: '/private/tmp/source/evaluation/fixtures/url-regression/case.json' },
        },
      }),
      toolEvent({
        shellToolCall: {
          args: {
            command:
              "cat ../outside/source.ts; node -e \"fs.readFileSync('/private/tmp/other/source.ts')\"; cat case.json; head ~/notes.md",
            workingDirectory: workspace,
          },
        },
      }),
    ]);

    const result = audit(workspace, tracePath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status).toBe(1);
    expect(report.valid).toBe(false);
    expect(report.violations.map(({ type }) => type)).toEqual([
      'outside-workspace-read',
      'oracle-read',
      'outside-workspace-read',
      'outside-workspace-read',
      'outside-workspace-read',
      'oracle-read',
    ]);
  });

  test('rejects write tools and write-capable shell commands', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      toolEvent({ writeToolCall: { args: { path: path.join(workspace, 'report.md') } } }),
      toolEvent({ createFileToolCall: { args: { path: path.join(workspace, 'report.md') } } }),
      toolEvent({ searchReplaceToolCall: { args: { path: path.join(workspace, 'source.ts') } } }),
      toolEvent({
        shellToolCall: {
          args: {
            command: 'git add report.md && git commit -m review',
            workingDirectory: workspace,
          },
        },
      }),
      toolEvent({
        shellToolCall: {
          args: {
            command: 'git apply fix.patch',
            workingDirectory: workspace,
          },
        },
      }),
      toolEvent({
        shellToolCall: {
          args: {
            command: 'pnpm install --frozen-lockfile',
            workingDirectory: workspace,
          },
        },
      }),
      toolEvent({
        shellToolCall: {
          args: {
            command: 'echo review > report.md',
            workingDirectory: workspace,
          },
        },
      }),
      toolEvent({
        shellToolCall: {
          args: {
            command: 'printf review | tee report.md',
            workingDirectory: workspace,
          },
        },
      }),
    ]);

    const result = audit(workspace, tracePath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status).toBe(1);
    expect(report.violations.map(({ type }) => type)).toEqual([
      'write-tool',
      'write-tool',
      'write-tool',
      'write-command',
      'write-command',
      'write-command',
      'write-command',
      'write-command',
    ]);
  });
});

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { rootDir } from './test-utils';

interface AuditResult {
  allowedMcpTools: string[];
  commandExecutionCount: number;
  contextCollector: {
    collectorCallCount: number;
    equivalentGitReads: Array<{ command: string; line: number }>;
    required: boolean;
    valid: boolean;
  };
  elapsedSeconds: number | null;
  finalResponseCharacters: number | null;
  finalResponseLines: number | null;
  mcpToolCallCount: number;
  mcpToolCalls: Array<{
    error: { message: string } | null;
    server: string;
    status: string;
    tool: string;
  }>;
  mcpToolFailureCount: number;
  toolCallCount: number;
  tokenUsage: {
    cacheWriteInputTokens: number | null;
    cachedInputTokens: number | null;
    inputTokens: number | null;
    outputTokens: number | null;
    reasoningOutputTokens: number | null;
    uncachedInputTokens: number | null;
  } | null;
  valid: boolean;
  violations: Array<{
    actual?: number;
    added?: string[];
    command?: string;
    expected?: number;
    line?: number;
    removed?: string[];
    type: string;
  }>;
  workspaceStatus: {
    added: string[];
    checked: boolean;
    removed: string[];
    unchanged: boolean | null;
  };
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

function commandEvents(id: string, command: string) {
  const item = {
    command,
    id,
    type: 'command_execution',
  };

  return [
    { item: { ...item, exit_code: null }, type: 'item.started' },
    { item: { ...item, exit_code: 0 }, type: 'item.completed' },
  ];
}

function mcpEvents(
  id: string,
  tool: string,
  status: 'completed' | 'failed',
  error: { message: string } | null = null,
  argumentsValue: unknown = {},
  server = 'playwright',
) {
  const item = {
    arguments: argumentsValue,
    id,
    server,
    tool,
    type: 'mcp_tool_call',
  };

  return [
    { item: { ...item, error: null, result: null, status: 'in_progress' }, type: 'item.started' },
    { item: { ...item, error, result: null, status }, type: 'item.completed' },
  ];
}

function audit(
  workspace: string,
  tracePath: string,
  includePnpmSeparator = false,
  baselineStatusPath?: string,
  elapsedSeconds?: number,
  allowedMcpTools: string[] = [],
  requireContextCollector = false,
) {
  return spawnSync(
    process.execPath,
    [
      auditScript,
      ...(includePnpmSeparator ? ['--'] : []),
      '--workspace',
      workspace,
      ...(baselineStatusPath ? ['--baseline-status', baselineStatusPath] : []),
      ...(elapsedSeconds === undefined ? [] : ['--elapsed-seconds', String(elapsedSeconds)]),
      ...(requireContextCollector ? ['--require-context-collector'] : []),
      ...allowedMcpTools.flatMap((tool) => ['--allow-mcp', tool]),
      tracePath,
    ],
    { encoding: 'utf8' },
  );
}

function initializeGitRepository(workspace: string) {
  const result = spawnSync('git', ['-C', workspace, 'init', '--quiet'], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
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

  test('audits current Codex command execution events once', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...commandEvents(
        'item_1',
        `/bin/zsh -lc 'git status --short && sed -n "1,40p" "src/url.ts"'`,
      ),
    ]);

    const result = audit(workspace, tracePath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status, result.stderr).toBe(0);
    expect(report.valid).toBe(true);
    expect(report.commandExecutionCount).toBe(1);
    expect(report.toolCallCount).toBe(1);
    expect(report.violations).toEqual([]);
  });

  test('accepts exactly one context collector without equivalent Git rereads', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...commandEvents(
        'item_1',
        'node .agents/skills/fe-code-review/scripts/collect-review-context.mjs --workspace "$PWD"',
      ),
      ...commandEvents('item_2', 'git show HEAD:src/url.ts'),
    ]);

    const result = audit(
      workspace,
      tracePath,
      false,
      undefined,
      undefined,
      [],
      true,
    );
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status, result.stderr).toBe(0);
    expect(report.contextCollector).toEqual({
      collectorCallCount: 1,
      equivalentGitReads: [],
      required: true,
      valid: true,
    });
    expect(report.violations).toEqual([]);
  });

  test('rejects a missing required context collector', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...commandEvents('item_1', 'git show HEAD:src/url.ts'),
    ]);

    const result = audit(
      workspace,
      tracePath,
      false,
      undefined,
      undefined,
      [],
      true,
    );
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status).toBe(1);
    expect(report.contextCollector.valid).toBe(false);
    expect(report.violations).toEqual([
      {
        actual: 0,
        expected: 1,
        type: 'context-collector-count',
      },
    ]);
  });

  test('rejects repeated context collector calls', () => {
    const workspace = makeWorkspace();
    const collectorCommand =
      'node .agents/skills/fe-code-review/scripts/collect-review-context.mjs --workspace "$PWD"';
    const tracePath = writeTrace(workspace, [
      ...commandEvents('item_1', collectorCommand),
      ...commandEvents('item_2', collectorCommand),
    ]);

    const result = audit(
      workspace,
      tracePath,
      false,
      undefined,
      undefined,
      [],
      true,
    );
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status).toBe(1);
    expect(report.contextCollector.collectorCallCount).toBe(2);
    expect(report.violations).toEqual([
      {
        actual: 2,
        expected: 1,
        type: 'context-collector-count',
      },
    ]);
  });

  test('rejects equivalent Git reads when the context collector is required', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...commandEvents(
        'item_1',
        'node .agents/skills/fe-code-review/scripts/collect-review-context.mjs --workspace "$PWD"',
      ),
      ...commandEvents('item_2', 'git diff --check'),
      ...commandEvents('item_3', 'git status --short'),
    ]);

    const result = audit(
      workspace,
      tracePath,
      false,
      undefined,
      undefined,
      [],
      true,
    );
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status).toBe(1);
    expect(report.contextCollector).toEqual({
      collectorCallCount: 1,
      equivalentGitReads: [
        { command: 'git diff --check', line: 3 },
        { command: 'git status --short', line: 5 },
      ],
      required: true,
      valid: false,
    });
    expect(report.violations.map(({ type }) => type)).toEqual([
      'context-collector-equivalent-git-read',
      'context-collector-equivalent-git-read',
    ]);
  });

  test('accepts explicitly read-only Git config and branch queries', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...commandEvents(
        'item_1',
        'git config --get user.name && git config user.email && git branch --show-current',
      ),
    ]);

    const result = audit(workspace, tracePath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status, result.stderr).toBe(0);
    expect(report.valid).toBe(true);
    expect(report.violations).toEqual([]);
  });

  test('does not treat an HTML doctype inside a read-only expression as output redirection', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...commandEvents(
        'item_1',
        `/bin/zsh -lc "node -e 'const html=\"<"'!DOCTYPE html>")'; console.log(html)'"`,
      ),
    ]);

    const result = audit(workspace, tracePath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status, result.stderr).toBe(0);
    expect(report.valid).toBe(true);
    expect(report.violations).toEqual([]);
  });

  test('accepts Codex shell-serialized quote fragments inside an HTML doctype', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...commandEvents(
        'item_1',
        String.raw`/bin/zsh -lc "node -e 'const html=\"<"'!DOCTYPE html><html></html>")'; console.log(html)'"'"`,
      ),
    ]);

    const result = audit(workspace, tracePath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status, result.stderr).toBe(0);
    expect(report.valid).toBe(true);
    expect(report.violations).toEqual([]);
  });

  test('still detects output redirection after an HTML expression', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...commandEvents(
        'item_1',
        `node -e "console.log('<!DOCTYPE html>')" > report.md`,
      ),
    ]);

    const result = audit(workspace, tracePath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status).toBe(1);
    expect(report.violations.map(({ type }) => type)).toEqual(['write-command']);
  });

  test('detects output redirection to a quoted file target', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...commandEvents('item_1', 'echo review > "report.md"'),
    ]);

    const result = audit(workspace, tracePath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status).toBe(1);
    expect(report.violations.map(({ type }) => type)).toEqual(['write-command']);
  });

  test('reports Codex token usage, final response size, and supplied elapsed time', () => {
    const workspace = makeWorkspace();
    const finalResponse = '## 结论\n\n可以关闭。';
    const tracePath = writeTrace(workspace, [
      {
        item: { id: 'item_1', text: 'working', type: 'agent_message' },
        type: 'item.completed',
      },
      {
        item: { id: 'item_2', text: finalResponse, type: 'agent_message' },
        type: 'item.completed',
      },
      {
        type: 'turn.completed',
        usage: {
          cache_write_input_tokens: 12,
          cached_input_tokens: 700,
          input_tokens: 1000,
          output_tokens: 200,
          reasoning_output_tokens: 80,
        },
      },
    ]);

    const result = audit(workspace, tracePath, false, undefined, 18.5);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status, result.stderr).toBe(0);
    expect(report.elapsedSeconds).toBe(18.5);
    expect(report.finalResponseCharacters).toBe(finalResponse.length);
    expect(report.finalResponseLines).toBe(3);
    expect(report.tokenUsage).toEqual({
      cacheWriteInputTokens: 12,
      cachedInputTokens: 700,
      inputTokens: 1000,
      outputTokens: 200,
      reasoningOutputTokens: 80,
      uncachedInputTokens: 300,
    });
  });

  test('reports unavailable efficiency metrics without inventing values', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, []);

    const result = audit(workspace, tracePath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status, result.stderr).toBe(0);
    expect(report.elapsedSeconds).toBeNull();
    expect(report.finalResponseCharacters).toBeNull();
    expect(report.finalResponseLines).toBeNull();
    expect(report.tokenUsage).toBeNull();
  });

  test('audits current Codex MCP events once and reports failures separately', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...mcpEvents('item_1', 'browser_navigate', 'completed'),
      ...mcpEvents(
        'item_2',
        'browser_tabs',
        'failed',
        { message: 'user cancelled MCP tool call' },
      ),
    ]);

    const result = audit(
      workspace,
      tracePath,
      false,
      undefined,
      undefined,
      ['playwright/browser_navigate', 'playwright/browser_tabs'],
    );
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status, result.stderr).toBe(0);
    expect(report.valid).toBe(true);
    expect(report.allowedMcpTools).toEqual([
      'playwright/browser_navigate',
      'playwright/browser_tabs',
    ]);
    expect(report.commandExecutionCount).toBe(0);
    expect(report.mcpToolCallCount).toBe(2);
    expect(report.mcpToolFailureCount).toBe(1);
    expect(report.toolCallCount).toBe(2);
    expect(report.mcpToolCalls).toEqual([
      expect.objectContaining({
        error: null,
        server: 'playwright',
        status: 'completed',
        tool: 'browser_navigate',
      }),
      expect.objectContaining({
        error: { message: 'user cancelled MCP tool call' },
        server: 'playwright',
        status: 'failed',
        tool: 'browser_tabs',
      }),
    ]);
    expect(report.violations).toEqual([]);
  });

  test('rejects MCP tools that were not explicitly allowed', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...mcpEvents('item_1', 'browser_navigate', 'completed'),
    ]);

    const result = audit(workspace, tracePath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status).toBe(1);
    expect(report.valid).toBe(false);
    expect(report.violations).toEqual([
      {
        line: 1,
        server: 'playwright',
        tool: 'browser_navigate',
        type: 'unapproved-mcp-tool',
      },
    ]);
  });

  test('rejects allowed MCP write tools and paths outside the workspace', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...mcpEvents(
        'item_1',
        'write_file',
        'completed',
        null,
        { path: '/private/tmp/outside-report.md' },
        'filesystem',
      ),
    ]);

    const result = audit(
      workspace,
      tracePath,
      false,
      undefined,
      undefined,
      ['filesystem/write_file'],
    );
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status).toBe(1);
    expect(report.valid).toBe(false);
    expect(report.violations.map(({ type }) => type)).toEqual([
      'write-tool',
      'outside-workspace-read',
    ]);
  });

  test('rejects camelCase MCP write tool names', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...mcpEvents('item_1', 'writeFile', 'completed', null, { path: 'report.md' }, 'filesystem'),
    ]);

    const result = audit(
      workspace,
      tracePath,
      false,
      undefined,
      undefined,
      ['filesystem/writeFile'],
    );
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status).toBe(1);
    expect(report.violations.map(({ type }) => type)).toEqual(['write-tool']);
  });

  test('accepts an unchanged Git status baseline', () => {
    const workspace = makeWorkspace();
    const evidenceDirectory = makeWorkspace();
    initializeGitRepository(workspace);
    const baselineStatusPath = path.join(evidenceDirectory, 'status-before.txt');
    fs.writeFileSync(baselineStatusPath, '');
    const tracePath = writeTrace(evidenceDirectory, []);

    const result = audit(workspace, tracePath, false, baselineStatusPath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status, result.stderr).toBe(0);
    expect(report.valid).toBe(true);
    expect(report.workspaceStatus).toEqual({
      added: [],
      checked: true,
      removed: [],
      unchanged: true,
    });
  });

  test('rejects client artifacts that change the workspace Git status', () => {
    const workspace = makeWorkspace();
    const evidenceDirectory = makeWorkspace();
    initializeGitRepository(workspace);
    const baselineStatusPath = path.join(evidenceDirectory, 'status-before.txt');
    fs.writeFileSync(baselineStatusPath, '');
    const tracePath = writeTrace(evidenceDirectory, []);
    const artifactDirectory = path.join(workspace, '.playwright-mcp');
    fs.mkdirSync(artifactDirectory);
    fs.writeFileSync(path.join(artifactDirectory, 'console.log'), 'browser error');

    const result = audit(workspace, tracePath, false, baselineStatusPath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status).toBe(1);
    expect(report.valid).toBe(false);
    expect(report.workspaceStatus).toEqual({
      added: ['?? .playwright-mcp/console.log'],
      checked: true,
      removed: [],
      unchanged: false,
    });
    expect(report.violations).toEqual([
      {
        added: ['?? .playwright-mcp/console.log'],
        removed: [],
        type: 'workspace-status-drift',
      },
    ]);
  });

  test('rejects current Codex command events that read outside or write', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...commandEvents('item_1', "/bin/zsh -lc 'cat ../outside/source.ts'"),
      ...commandEvents('item_2', "/bin/zsh -lc 'git commit -m review'"),
    ]);

    const result = audit(workspace, tracePath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status).toBe(1);
    expect(report.commandExecutionCount).toBe(2);
    expect(report.toolCallCount).toBe(2);
    expect(report.violations.map(({ type }) => type)).toEqual([
      'outside-workspace-read',
      'write-command',
    ]);
  });

  test('rejects Git metadata writes that do not appear in Git status', () => {
    const workspace = makeWorkspace();
    const tracePath = writeTrace(workspace, [
      ...commandEvents('item_1', 'git config user.name reviewer'),
      ...commandEvents('item_2', 'git branch generated-review'),
      ...commandEvents('item_3', 'git update-ref refs/heads/review HEAD'),
    ]);

    const result = audit(workspace, tracePath);
    const report = JSON.parse(result.stdout) as AuditResult;

    expect(result.status).toBe(1);
    expect(report.violations.map(({ type }) => type)).toEqual([
      'write-command',
      'write-command',
      'write-command',
    ]);
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

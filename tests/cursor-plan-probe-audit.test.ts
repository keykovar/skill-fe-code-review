import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { hashCursorEvaluationTreeV5 } from '../scripts/run-cursor-evaluation-v5.mjs';
import { rootDir } from './test-utils';

const temporaryDirectories: string[] = [];
const auditPath = path.join(rootDir, 'scripts', 'audit-cursor-plan-probe.mjs');
const command = '/usr/bin/git status --short --untracked-files=all';
const response = 'PLAN_READ_ONLY_OK';

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-plan-probe-audit-'));
  temporaryDirectories.push(root);
  const workspace = path.join(root, 'workspace');
  fs.mkdirSync(workspace);
  fs.writeFileSync(path.join(workspace, 'public.txt'), 'public synthetic\n');
  const workspaceTreeSha256 = hashCursorEvaluationTreeV5(workspace).sha256;
  const toolCallId = 'call-01';
  const shellToolCall = {
    args: {
      command,
      requestedSandboxPolicy: { type: 'TYPE_WORKSPACE_READWRITE' },
      workingDirectory: '',
    },
    description: 'Show short git status with untracked',
  };
  const events = [
    {
      message: { content: [{ text: 'Checking once.', type: 'text' }], role: 'assistant' },
      type: 'assistant',
    },
    {
      subtype: 'started',
      tool_call: { shellToolCall, toolCallId },
      type: 'tool_call',
    },
    {
      subtype: 'completed',
      tool_call: {
        shellToolCall: {
          ...shellToolCall,
          result: {
            success: { command, exitCode: 0, stderr: '', stdout: '', workingDirectory: '' },
          },
        },
        toolCallId,
      },
      type: 'tool_call',
    },
    {
      message: { content: [{ text: response, type: 'text' }], role: 'assistant' },
      type: 'assistant',
    },
    {
      is_error: false,
      result: `Checking once.${response}`,
      subtype: 'success',
      type: 'result',
    },
  ];
  const tracePath = path.join(root, 'trace.jsonl');
  fs.writeFileSync(tracePath, `${events.map((event) => JSON.stringify(event)).join('\n')}\n`);
  const treeWithTraceSha256 = hashCursorEvaluationTreeV5(workspace).sha256;
  return { events, tracePath, treeWithTraceSha256, workspace, workspaceTreeSha256 };
}

function audit(fixture: ReturnType<typeof createFixture>) {
  return spawnSync(
    process.execPath,
    [
      auditPath,
      '--expected-command',
      command,
      '--expected-response-sha256',
      sha256(response),
      '--expected-workspace-tree-sha256',
      fixture.treeWithTraceSha256,
      '--workspace',
      fixture.workspace,
      fixture.tracePath,
    ],
    { encoding: 'utf8' },
  );
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('Candidate 09 Cursor Plan-mode probe audit', () => {
  test('accepts an exact final response and Cursor aggregate result semantics', () => {
    const fixture = createFixture();
    const result = audit(fixture);
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      aggregateResponseMatchesAssistantMessages: true,
      assistantMessageCount: 2,
      command,
      commandExecutionCount: 1,
      finalAssistantResponseSha256: sha256(response),
      mcpCallCount: 0,
      requestedSandboxPolicy: 'TYPE_WORKSPACE_READWRITE',
      shellToolCallCount: 1,
      valid: true,
      violations: [],
    });
  });

  test('rejects a result event that is not the ordered assistant aggregate', () => {
    const fixture = createFixture();
    fixture.events.at(-1)!.result = response;
    fs.writeFileSync(
      fixture.tracePath,
      `${fixture.events.map((event) => JSON.stringify(event)).join('\n')}\n`,
    );
    fixture.treeWithTraceSha256 = hashCursorEvaluationTreeV5(fixture.workspace).sha256;
    const result = audit(fixture);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).violations).toContainEqual({
      type: 'result-aggregate-mismatch',
    });
  });

  test('rejects a changed workspace tree', () => {
    const fixture = createFixture();
    const expectedTree = fixture.treeWithTraceSha256;
    fs.writeFileSync(path.join(fixture.workspace, 'mutation.txt'), 'changed\n');
    fixture.treeWithTraceSha256 = expectedTree;
    const result = audit(fixture);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'workspace-tree-mismatch' })]),
    );
  });

  test('rejects additional tool calls', () => {
    const fixture = createFixture();
    fixture.events.splice(3, 0, {
      subtype: 'started',
      tool_call: { readToolCall: { args: { path: '/tmp/other' } }, toolCallId: 'call-02' },
      type: 'tool_call',
    });
    fs.writeFileSync(
      fixture.tracePath,
      `${fixture.events.map((event) => JSON.stringify(event)).join('\n')}\n`,
    );
    fixture.treeWithTraceSha256 = hashCursorEvaluationTreeV5(fixture.workspace).sha256;
    const result = audit(fixture);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'non-shell-tool' })]),
    );
  });
});

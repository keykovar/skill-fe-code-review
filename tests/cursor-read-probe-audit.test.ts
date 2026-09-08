import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { hashCursorEvaluationTreeV5 } from '../scripts/run-cursor-evaluation-v5.mjs';
import { rootDir } from './test-utils';

const temporaryDirectories: string[] = [];
const auditPath = path.join(rootDir, 'scripts', 'audit-cursor-read-probe.mjs');
const expectedPath = 'probe.txt';
const response = 'PLAN_READ_ONLY_OK';

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-read-probe-audit-'));
  temporaryDirectories.push(root);
  const workspace = path.join(root, 'workspace');
  fs.mkdirSync(workspace);
  const probePath = path.join(workspace, expectedPath);
  fs.writeFileSync(probePath, 'CANDIDATE_11_READ_OK\n');
  const toolCallId = 'call-read-01';
  const startedRead = {
    args: { path: expectedPath },
  };
  const completedRead = {
    args: { path: probePath },
    result: {
      success: {
        contentBlobId: 'blob-public-synthetic',
        exceededLimit: false,
        fileSize: 21,
        isEmpty: false,
        path: probePath,
        readRange: { endLine: 1, startLine: 1 },
        totalLines: 1,
      },
    },
  };
  const events = [
    {
      message: { content: [{ text: 'Reading once.', type: 'text' }], role: 'assistant' },
      type: 'assistant',
    },
    {
      subtype: 'started',
      tool_call: { readToolCall: startedRead, toolCallId },
      type: 'tool_call',
    },
    {
      subtype: 'completed',
      tool_call: { readToolCall: completedRead, toolCallId },
      type: 'tool_call',
    },
    {
      message: { content: [{ text: response, type: 'text' }], role: 'assistant' },
      type: 'assistant',
    },
    {
      is_error: false,
      result: `Reading once.${response}`,
      subtype: 'success',
      type: 'result',
    },
  ];
  const tracePath = path.join(root, 'trace.jsonl');
  writeEvents(tracePath, events);
  return {
    events,
    probePath,
    tracePath,
    workspace,
    workspaceTreeSha256: hashCursorEvaluationTreeV5(workspace).sha256,
  };
}

function writeEvents(tracePath: string, events: Array<Record<string, any>>) {
  fs.writeFileSync(tracePath, `${events.map((event) => JSON.stringify(event)).join('\n')}\n`);
}

function audit(fixture: ReturnType<typeof createFixture>) {
  return spawnSync(
    process.execPath,
    [
      auditPath,
      '--expected-path',
      expectedPath,
      '--expected-response-sha256',
      sha256(response),
      '--expected-workspace-tree-sha256',
      fixture.workspaceTreeSha256,
      '--workspace',
      fixture.workspace,
      fixture.tracePath,
    ],
    { encoding: 'utf8' },
  );
}

function completedRead(fixture: ReturnType<typeof createFixture>) {
  return fixture.events.find(
    (event) => event.type === 'tool_call' && event.subtype === 'completed',
  )!.tool_call.readToolCall;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
});

describe('Candidate 11 Cursor Read-tool probe audit', () => {
  test('accepts one successful workspace-local read and exact aggregate output', () => {
    const fixture = createFixture();
    const result = audit(fixture);

    expect(result.status, `${result.stderr}\n${result.stdout}`).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      aggregateResponseMatchesAssistantMessages: true,
      assistantMessageCount: 2,
      expectedReadPath: fs.realpathSync(fixture.probePath),
      finalAssistantResponseSha256: sha256(response),
      mcpCallCount: 0,
      readResultKind: 'success',
      readSucceeded: true,
      readToolCallCount: 1,
      shellCallCount: 0,
      valid: true,
      violations: [],
    });
  });

  test('rejects a failed read result', () => {
    const fixture = createFixture();
    completedRead(fixture).result = {
      failure: { path: fixture.probePath, reason: 'read failed' },
    };
    writeEvents(fixture.tracePath, fixture.events);
    const result = audit(fixture);
    const output = JSON.parse(result.stdout);

    expect(result.status).toBe(1);
    expect(output.readResultKind).toBe('failure');
    expect(output.violations).toContainEqual({
      actual: 'failure',
      expected: 'success',
      type: 'read-result',
    });
  });

  test('rejects a rejected read result', () => {
    const fixture = createFixture();
    completedRead(fixture).result = {
      rejected: { path: fixture.probePath, reason: 'permission denied' },
    };
    writeEvents(fixture.tracePath, fixture.events);
    const result = audit(fixture);
    const output = JSON.parse(result.stdout);

    expect(result.status).toBe(1);
    expect(output.readResultKind).toBe('rejected');
    expect(output.violations).toContainEqual({
      actual: 'rejected',
      expected: 'success',
      type: 'read-result',
    });
  });

  test('rejects a read path outside the workspace', () => {
    const fixture = createFixture();
    const outsidePath = path.join(path.dirname(fixture.workspace), 'outside.txt');
    const started = fixture.events.find(
      (event) => event.type === 'tool_call' && event.subtype === 'started',
    )!.tool_call.readToolCall;
    started.args.path = outsidePath;
    completedRead(fixture).args.path = outsidePath;
    completedRead(fixture).result.success.path = outsidePath;
    writeEvents(fixture.tracePath, fixture.events);
    const result = audit(fixture);
    const output = JSON.parse(result.stdout);

    expect(result.status).toBe(1);
    expect(output.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'read-path-mismatch' }),
        { type: 'outside-workspace-read' },
      ]),
    );
  });

  test('rejects any additional tool event', () => {
    const fixture = createFixture();
    fixture.events.splice(3, 0, {
      subtype: 'started',
      tool_call: { shellToolCall: { args: { command: 'pwd' } }, toolCallId: 'shell-01' },
      type: 'tool_call',
    });
    writeEvents(fixture.tracePath, fixture.events);
    const result = audit(fixture);
    const output = JSON.parse(result.stdout);

    expect(result.status).toBe(1);
    expect(output.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'read-tool-count' }),
        expect.objectContaining({ type: 'shell-call' }),
        expect.objectContaining({ type: 'non-read-tool' }),
      ]),
    );
  });

  test('rejects a result event that is not the ordered assistant aggregate', () => {
    const fixture = createFixture();
    fixture.events.at(-1)!.result = response;
    writeEvents(fixture.tracePath, fixture.events);
    const result = audit(fixture);

    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).violations).toContainEqual({
      type: 'result-aggregate-mismatch',
    });
  });

  test('rejects a changed workspace tree', () => {
    const fixture = createFixture();
    fs.writeFileSync(path.join(fixture.workspace, 'mutation.txt'), 'changed\n');
    const result = audit(fixture);

    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'workspace-tree-mismatch' })]),
    );
  });
});

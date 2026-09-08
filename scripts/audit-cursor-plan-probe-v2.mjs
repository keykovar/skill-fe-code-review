#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { hashCursorEvaluationTreeV6 } from './run-cursor-evaluation-v6.mjs';

const scriptPath = fileURLToPath(import.meta.url);

function usage() {
  return 'Usage: node scripts/audit-cursor-plan-probe.mjs --expected-command <command> --expected-response-sha256 <sha256> --expected-workspace-tree-sha256 <sha256> --workspace <directory> <trace.jsonl>';
}

function parseArguments(argv) {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  const options = {};
  let tracePath = null;
  for (let index = 0; index < normalized.length; index += 1) {
    const value = normalized[index];
    if (value.startsWith('--')) {
      const optionValue = normalized[index + 1];
      if (!optionValue || optionValue.startsWith('--') || Object.hasOwn(options, value)) {
        throw new Error(usage());
      }
      options[value] = optionValue;
      index += 1;
    } else if (tracePath === null) {
      tracePath = value;
    } else {
      throw new Error(usage());
    }
  }
  for (const name of [
    '--expected-command',
    '--expected-response-sha256',
    '--expected-workspace-tree-sha256',
    '--workspace',
  ]) {
    if (!options[name]) throw new Error(usage());
  }
  if (!tracePath) throw new Error(usage());
  return { options, tracePath };
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function requireSha256(value, name) {
  if (!/^[a-f0-9]{64}$/u.test(value)) {
    throw new Error(`${name} must be a lowercase SHA-256 value.`);
  }
  return value;
}

function requireFile(value, name) {
  const resolved = fs.realpathSync(path.resolve(value));
  if (!fs.statSync(resolved).isFile()) throw new Error(`${name} must be a file.`);
  return resolved;
}

function requireDirectory(value, name) {
  const resolved = fs.realpathSync(path.resolve(value));
  if (!fs.statSync(resolved).isDirectory()) throw new Error(`${name} must be a directory.`);
  return resolved;
}

function assistantText(event) {
  if (!Array.isArray(event?.message?.content)) return null;
  const textItems = event.message.content.filter((item) => item?.type === 'text');
  if (textItems.length !== event.message.content.length) return null;
  return textItems.map((item) => item.text ?? '').join('');
}

function readEvents(tracePath) {
  return fs
    .readFileSync(tracePath, 'utf8')
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .filter(Boolean)
    .map((line, index) => {
      try {
        return { event: JSON.parse(line), line: index + 1 };
      } catch (error) {
        throw new Error(`Invalid JSON on line ${index + 1}: ${error.message}`);
      }
    });
}

export function auditCursorPlanProbe(argv) {
  const { options, tracePath: requestedTracePath } = parseArguments(argv);
  const workspace = requireDirectory(options['--workspace'], '--workspace');
  const tracePath = requireFile(requestedTracePath, 'trace');
  const expectedResponseSha256 = requireSha256(
    options['--expected-response-sha256'],
    '--expected-response-sha256',
  );
  const expectedWorkspaceTreeSha256 = requireSha256(
    options['--expected-workspace-tree-sha256'],
    '--expected-workspace-tree-sha256',
  );
  const expectedCommand = options['--expected-command'];
  const events = readEvents(tracePath);
  const violations = [];
  const assistants = events.filter(({ event }) => event.type === 'assistant');
  const started = events.filter(
    ({ event }) => event.type === 'tool_call' && event.subtype === 'started',
  );
  const completed = events.filter(
    ({ event }) => event.type === 'tool_call' && event.subtype === 'completed',
  );
  const results = events.filter(({ event }) => event.type === 'result');

  if (assistants.length < 1 || assistants.length > 2) {
    violations.push({ actual: assistants.length, expected: '1 or 2', type: 'assistant-count' });
  }
  const assistantTexts = assistants.map(({ event }) => assistantText(event));
  if (assistantTexts.some((value) => value === null)) {
    violations.push({ type: 'assistant-non-text-content' });
  }
  const finalAssistantText = assistantTexts.at(-1) ?? '';
  if (sha256(finalAssistantText) !== expectedResponseSha256) {
    violations.push({ type: 'final-assistant-response-mismatch' });
  }

  if (started.length !== 1 || completed.length !== 1) {
    violations.push({
      actual: `${started.length}/${completed.length}`,
      expected: '1/1',
      type: 'shell-tool-count',
    });
  }
  const startedShell = started[0]?.event?.tool_call?.shellToolCall;
  const completedShell = completed[0]?.event?.tool_call?.shellToolCall;
  if (!startedShell || !completedShell) {
    violations.push({ type: 'shell-tool-shape' });
  }
  const startedCommand = startedShell?.args?.command;
  const completedArgsCommand = completedShell?.args?.command;
  const commandSuccess = completedShell?.result?.success;
  const commandFailure = completedShell?.result?.failure;
  if (Boolean(commandSuccess) === Boolean(commandFailure)) {
    violations.push({ type: 'shell-result-shape' });
  }
  const commandResult = commandSuccess ?? commandFailure;
  const completedResultCommand = commandResult?.command;
  if (
    startedCommand !== expectedCommand ||
    completedArgsCommand !== expectedCommand ||
    completedResultCommand !== expectedCommand
  ) {
    violations.push({
      actual: [startedCommand, completedArgsCommand, completedResultCommand],
      expected: [expectedCommand, expectedCommand, expectedCommand],
      type: 'command-mismatch',
    });
  }
  if (started[0]?.event?.tool_call?.toolCallId !== completed[0]?.event?.tool_call?.toolCallId) {
    violations.push({ type: 'tool-call-id-mismatch' });
  }
  const workingDirectory = startedShell?.args?.workingDirectory;
  if (workingDirectory !== '' && path.resolve(workingDirectory ?? '') !== workspace) {
    violations.push({ actual: workingDirectory ?? null, expected: workspace, type: 'working-directory' });
  }
  if (commandFailure) {
    violations.push({ actual: commandFailure.exitCode ?? null, type: 'command-failed' });
  }
  if (commandResult?.exitCode !== 0) {
    violations.push({ actual: commandResult?.exitCode ?? null, expected: 0, type: 'command-exit' });
  }
  if ((commandResult?.stdout ?? '') !== '' || (commandResult?.stderr ?? '') !== '') {
    violations.push({ type: 'command-output-not-empty' });
  }

  const nonShellTools = [...started, ...completed].filter(
    ({ event }) => !event?.tool_call?.shellToolCall,
  );
  if (nonShellTools.length > 0) {
    violations.push({ actual: nonShellTools.length, expected: 0, type: 'non-shell-tool' });
  }
  const mcpCalls = events.filter(({ event }) => JSON.stringify(event).includes('mcpToolCall'));
  if (mcpCalls.length > 0) {
    violations.push({ actual: mcpCalls.length, expected: 0, type: 'mcp-call' });
  }

  if (results.length !== 1 || results[0]?.event?.subtype !== 'success') {
    violations.push({ actual: results.length, expected: 1, type: 'result-event' });
  }
  const resultEvent = results[0]?.event;
  if (resultEvent?.is_error === true) {
    violations.push({ type: 'result-is-error' });
  }
  const aggregateResponse = assistantTexts.filter((value) => value !== null).join('');
  if ((resultEvent?.result ?? '') !== aggregateResponse) {
    violations.push({ type: 'result-aggregate-mismatch' });
  }
  if ((started[0]?.line ?? Infinity) >= (completed[0]?.line ?? -Infinity)) {
    violations.push({ type: 'tool-order' });
  }
  if ((completed[0]?.line ?? Infinity) >= (assistants.at(-1)?.line ?? -Infinity)) {
    violations.push({ type: 'final-assistant-order' });
  }

  const workspaceTree = hashCursorEvaluationTreeV6(workspace);
  if (workspaceTree.sha256 !== expectedWorkspaceTreeSha256) {
    violations.push({
      actual: workspaceTree.sha256,
      expected: expectedWorkspaceTreeSha256,
      type: 'workspace-tree-mismatch',
    });
  }

  return {
    aggregateResponseMatchesAssistantMessages: (resultEvent?.result ?? '') === aggregateResponse,
    assistantMessageCount: assistants.length,
    command: startedCommand ?? null,
    commandExecutionCount: commandResult ? 1 : 0,
    commandExitCode: commandResult?.exitCode ?? null,
    commandResultKind: commandSuccess ? 'success' : commandFailure ? 'failure' : null,
    commandSucceeded: Boolean(commandSuccess) && commandSuccess.exitCode === 0,
    eventCount: events.length,
    finalAssistantResponseSha256: sha256(finalAssistantText),
    mcpCallCount: mcpCalls.length,
    requestedSandboxPolicy: startedShell?.args?.requestedSandboxPolicy?.type ?? null,
    resultEventCount: results.length,
    shellToolCallCount: started.length,
    tracePath,
    valid: violations.length === 0,
    violations,
    workspace,
    workspaceTreeSha256: workspaceTree.sha256,
  };
}

function main() {
  try {
    const result = auditCursorPlanProbe(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.valid ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}

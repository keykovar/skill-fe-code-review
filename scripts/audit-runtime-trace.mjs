#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const forbiddenPathFragments = [
  '/docs/evaluation-results/',
  '/evaluation/fixtures/',
  '/examples/outputs/',
];
const writeToolPattern =
  /(create|delete|edit|move|patch|remove|rename|replace|write).*toolcall/i;
const writeCommandPattern =
  /(?:^|[;&|]\s*)(?:chmod|chown|cp|dd|install|ln|mkdir|mv|rm|rsync|tee|touch|truncate)\b|(?:^|[;&|]\s*)git\s+(?:add|am|apply|checkout|cherry-pick|clean|commit|fetch|merge|pull|push|rebase|reset|restore|revert|stash|switch|tag)(?=\s|$)|(?:^|[;&|]\s*)(?:npm|pnpm|yarn)\s+(?:add|ci|install|remove|uninstall|update|upgrade)(?=\s|$)/u;

function usage() {
  return 'Usage: node scripts/audit-runtime-trace.mjs --workspace <directory> <trace.jsonl>';
}

function parseArguments(argv) {
  const normalizedArguments = argv[0] === '--' ? argv.slice(1) : argv;
  if (normalizedArguments.length !== 3 || normalizedArguments[0] !== '--workspace') {
    throw new Error(usage());
  }

  return {
    tracePath: path.resolve(normalizedArguments[2]),
    workspace: fs.realpathSync(path.resolve(normalizedArguments[1])),
  };
}

function isWithinWorkspace(candidate, workspace) {
  const relative = path.relative(workspace, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..');
}

function normalizeRequestedPath(value, workspace) {
  const absolutePath = path.resolve(workspace, value);
  const missingSegments = [];
  let existingPath = absolutePath;

  while (!fs.existsSync(existingPath)) {
    const parent = path.dirname(existingPath);
    if (parent === existingPath) {
      return absolutePath;
    }

    missingSegments.unshift(path.basename(existingPath));
    existingPath = parent;
  }

  return path.join(fs.realpathSync(existingPath), ...missingSegments);
}

function inspectRequestedPath(value, workspace, lineNumber, violations) {
  if (typeof value !== 'string' || value.length === 0) {
    return;
  }

  const requestedPath = normalizeRequestedPath(value, workspace);
  const normalized = requestedPath.split(path.sep).join('/');
  const forbiddenOraclePath =
    path.basename(requestedPath) === 'case.json' ||
    forbiddenPathFragments.some((fragment) => normalized.includes(fragment));

  if (forbiddenOraclePath) {
    violations.push({
      line: lineNumber,
      path: requestedPath,
      type: 'oracle-read',
    });
    return;
  }

  if (!isWithinWorkspace(requestedPath, workspace)) {
    violations.push({
      line: lineNumber,
      path: requestedPath,
      type: 'outside-workspace-read',
    });
  }
}

function inspectShellCommand(command, workspace, lineNumber, violations) {
  const commandWithoutHereDocuments = stripHereDocuments(command);
  const shellPathPattern = /(?:^|[\s'"=])((?:~|\/|\.\.\/)[^\s'"`;|&]*)/gu;

  for (const match of commandWithoutHereDocuments.matchAll(shellPathPattern)) {
    const requestedPath = match[1];
    if (requestedPath === '/dev/null') {
      continue;
    }

    if (requestedPath.startsWith('~')) {
      violations.push({
        line: lineNumber,
        path: requestedPath,
        type: 'outside-workspace-read',
      });
      continue;
    }

    inspectRequestedPath(requestedPath, workspace, lineNumber, violations);
  }

  if (
    /(?:^|[\s'"=])(?:\.\/)?case\.json(?=$|[\s'"`;|&])/u.test(commandWithoutHereDocuments)
  ) {
    violations.push({
      line: lineNumber,
      path: 'case.json',
      type: 'oracle-read',
    });
  }
}

function stripHereDocuments(command) {
  const keptLines = [];
  let delimiter;

  for (const line of command.split('\n')) {
    if (delimiter) {
      if (line.trim() === delimiter) {
        delimiter = undefined;
      }
      continue;
    }

    keptLines.push(line);
    const match = line.match(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/u);
    if (match) {
      delimiter = match[2];
    }
  }

  return keptLines.join('\n');
}

function hasFileOutputRedirect(command) {
  const withoutHereDocuments = stripHereDocuments(command);
  let unquoted = '';
  let quote;

  for (const character of withoutHereDocuments) {
    if (quote) {
      if (character === quote) {
        quote = undefined;
      }
      unquoted += ' ';
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      unquoted += ' ';
      continue;
    }

    unquoted += character;
  }

  return />>?\s*(?!&[12](?=\s|[;&|]|$)|\/dev\/null(?=\s|[;&|]|$))[^\s;&|]+/u.test(
    unquoted,
  );
}

function inspectToolCall(toolCall, workspace, lineNumber, violations) {
  if (!toolCall || typeof toolCall !== 'object') {
    return 0;
  }

  let inspected = 0;
  for (const [toolName, payload] of Object.entries(toolCall)) {
    if (!toolName.toLowerCase().endsWith('toolcall') || !payload || typeof payload !== 'object') {
      continue;
    }

    inspected += 1;
    if (writeToolPattern.test(toolName)) {
      violations.push({ line: lineNumber, tool: toolName, type: 'write-tool' });
    }

    const args = payload.args;
    if (!args || typeof args !== 'object') {
      continue;
    }

    for (const key of ['path', 'targetDirectory', 'workingDirectory']) {
      if (key in args) {
        inspectRequestedPath(args[key], workspace, lineNumber, violations);
      }
    }

    if (typeof args.command === 'string') {
      inspectShellCommand(args.command, workspace, lineNumber, violations);

      if (writeCommandPattern.test(args.command) || hasFileOutputRedirect(args.command)) {
        violations.push({
          command: args.command,
          line: lineNumber,
          type: 'write-command',
        });
      }
    }
  }

  return inspected;
}

function auditTrace(tracePath, workspace) {
  const content = fs.readFileSync(tracePath, 'utf8');
  const violations = [];
  let eventCount = 0;
  let toolCallCount = 0;

  for (const [index, rawLine] of content.split(/\r?\n/u).entries()) {
    if (!rawLine.trim()) {
      continue;
    }

    let event;
    try {
      event = JSON.parse(rawLine);
    } catch (error) {
      throw new Error(`Invalid JSON on line ${index + 1}: ${error.message}`);
    }

    eventCount += 1;
    if (event.type === 'tool_call' && event.subtype === 'started') {
      toolCallCount += inspectToolCall(event.tool_call, workspace, index + 1, violations);
    }
  }

  return {
    eventCount,
    toolCallCount,
    tracePath,
    valid: violations.length === 0,
    violations,
    workspace,
  };
}

try {
  const { tracePath, workspace } = parseArguments(process.argv.slice(2));
  const result = auditTrace(tracePath, workspace);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.valid ? 0 : 1;
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 2;
}

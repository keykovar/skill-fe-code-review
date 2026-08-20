#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const forbiddenPathFragments = [
  '/docs/evaluation-results/',
  '/evaluation/fixtures/',
  '/examples/outputs/',
];
const writeToolPattern =
  /(create|delete|edit|move|patch|remove|rename|replace|write).*toolcall/i;
const mcpWriteToolPattern =
  /(?:^|[_-])(?:create|delete|edit|move|mutate|patch|publish|remove|rename|replace|send|submit|update|upload|write)(?:[_-]|$)/u;
const writeCommandPattern =
  /(?:^|[;&|]\s*)(?:chmod|chown|cp|dd|install|ln|mkdir|mv|rm|rsync|tee|touch|truncate)\b|(?:^|[;&|]\s*)(?:npm|pnpm|yarn)\s+(?:add|ci|install|remove|uninstall|update|upgrade)(?=\s|$)/u;
const readOnlyGitSubcommands = new Set([
  'blame',
  'cat-file',
  'check-attr',
  'check-ignore',
  'check-mailmap',
  'check-ref-format',
  'count-objects',
  'describe',
  'diff',
  'diff-files',
  'diff-index',
  'diff-tree',
  'for-each-ref',
  'grep',
  'log',
  'ls-files',
  'ls-remote',
  'ls-tree',
  'merge-base',
  'name-rev',
  'rev-list',
  'rev-parse',
  'shortlog',
  'show',
  'show-branch',
  'status',
]);
const gitGlobalOptionsWithValue = new Set([
  '-C',
  '-c',
  '--config-env',
  '--exec-path',
  '--git-dir',
  '--namespace',
  '--super-prefix',
  '--work-tree',
]);
const gitGlobalOptionsWithoutValue = new Set([
  '--bare',
  '--help',
  '--html-path',
  '--info-path',
  '--literal-pathspecs',
  '--man-path',
  '--no-optional-locks',
  '--no-pager',
  '--no-replace-objects',
  '--paginate',
  '--version',
]);
const mcpPathArgumentKeys = new Set([
  'cwd',
  'directory',
  'file',
  'filepath',
  'outputdir',
  'outputdirectory',
  'path',
  'paths',
  'root',
  'targetdirectory',
  'workingdirectory',
  'workspace',
]);

function usage() {
  return 'Usage: node scripts/audit-runtime-trace.mjs --workspace <directory> [--baseline-status <file>] [--elapsed-seconds <number>] [--require-context-collector] [--allow-mcp <server/tool>]... <trace.jsonl>';
}

function parseArguments(argv) {
  const normalizedArguments = argv[0] === '--' ? argv.slice(1) : argv;
  let baselineStatusPath;
  let elapsedSeconds;
  let requireContextCollector = false;
  let tracePath;
  let workspacePath;
  const allowedMcpTools = new Set();

  for (let index = 0; index < normalizedArguments.length; index += 1) {
    const argument = normalizedArguments[index];
    if (argument === '--require-context-collector') {
      requireContextCollector = true;
      continue;
    }

    if (
      argument === '--workspace' ||
      argument === '--baseline-status' ||
      argument === '--elapsed-seconds' ||
      argument === '--allow-mcp'
    ) {
      const value = normalizedArguments[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(usage());
      }

      if (argument === '--workspace') {
        workspacePath = value;
      } else if (argument === '--baseline-status') {
        baselineStatusPath = path.resolve(value);
      } else if (argument === '--allow-mcp') {
        if (!/^[^/\s]+\/[^/\s]+$/u.test(value)) {
          throw new Error(usage());
        }
        allowedMcpTools.add(value);
      } else {
        elapsedSeconds = Number(value);
        if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
          throw new Error(usage());
        }
      }
      index += 1;
      continue;
    }

    if (argument.startsWith('--') || tracePath) {
      throw new Error(usage());
    }
    tracePath = path.resolve(argument);
  }

  if (!workspacePath || !tracePath) {
    throw new Error(usage());
  }

  return {
    allowedMcpTools,
    baselineStatusPath,
    elapsedSeconds: elapsedSeconds ?? null,
    requireContextCollector,
    tracePath,
    workspace: fs.realpathSync(path.resolve(workspacePath)),
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
  const commandWithoutHereDocuments = stripHereDocuments(unwrapShellCommand(command));
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

function unwrapShellCommand(command) {
  const match = command.match(/^\/bin\/(?:ba|z)?sh\s+-lc\s+([\s\S]+)$/u);
  if (!match) {
    return command;
  }

  const payload = match[1].trim();
  const quote = payload[0];
  if ((quote === "'" || quote === '"') && payload.at(-1) === quote) {
    return payload.slice(1, -1);
  }

  return payload;
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
  let withoutHereDocuments = stripHereDocuments(command);
  if (/(?:^|\s)node\s+-e\s/u.test(withoutHereDocuments)) {
    withoutHereDocuments = withoutHereDocuments
      .replace(/<(?:\\?["'])*!DOCTYPE\s+html>/giu, (doctype) =>
        doctype.replace('>', ' '),
      )
      .replace(/<(?:\\?["'])*\/?html>/giu, (tag) => tag.replace('>', ' '));
  }
  let quote;
  let escaped = false;

  for (let index = 0; index < withoutHereDocuments.length; index += 1) {
    const character = withoutHereDocuments[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\' && quote === '"') {
        escaped = true;
      } else if (character === quote) {
        quote = undefined;
      }
      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }

    if (character !== '>') {
      continue;
    }

    let targetIndex = index + (withoutHereDocuments[index + 1] === '>' ? 2 : 1);
    while (/\s/u.test(withoutHereDocuments[targetIndex] ?? '')) {
      targetIndex += 1;
    }

    if (withoutHereDocuments[targetIndex] === '&') {
      continue;
    }

    const targetQuote = withoutHereDocuments[targetIndex];
    let target = '';
    if (targetQuote === "'" || targetQuote === '"') {
      targetIndex += 1;
      while (
        targetIndex < withoutHereDocuments.length &&
        withoutHereDocuments[targetIndex] !== targetQuote
      ) {
        target += withoutHereDocuments[targetIndex];
        targetIndex += 1;
      }
    } else {
      while (
        targetIndex < withoutHereDocuments.length &&
        !/[\s;&|]/u.test(withoutHereDocuments[targetIndex])
      ) {
        target += withoutHereDocuments[targetIndex];
        targetIndex += 1;
      }
    }

    if (target && target !== '/dev/null') {
      return true;
    }
  }

  return false;
}

function splitShellSegments(command) {
  const segments = [];
  let currentSegment = [];
  let currentToken = '';
  let escaped = false;
  let quote;

  const finishToken = () => {
    if (currentToken) {
      currentSegment.push(currentToken);
      currentToken = '';
    }
  };
  const finishSegment = () => {
    finishToken();
    if (currentSegment.length > 0) {
      segments.push(currentSegment);
      currentSegment = [];
    }
  };

  for (const character of stripHereDocuments(command)) {
    if (escaped) {
      currentToken += character;
      escaped = false;
      continue;
    }
    if (character === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) {
        quote = undefined;
      } else {
        currentToken += character;
      }
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (character === '`' || /[;&|()\n]/u.test(character)) {
      finishSegment();
      continue;
    }
    if (/\s/u.test(character)) {
      finishToken();
      continue;
    }
    currentToken += character;
  }
  finishSegment();
  return segments;
}

function isReadOnlyGitConfig(args) {
  const writeOptions = new Set([
    '--add',
    '--edit',
    '--remove-section',
    '--rename-section',
    '--replace-all',
    '--unset',
    '--unset-all',
    '-e',
  ]);
  if (args.some((argument) => writeOptions.has(argument))) {
    return false;
  }

  const readActions = new Set([
    '--get',
    '--get-all',
    '--get-regexp',
    '--get-urlmatch',
    '--list',
    '--name-only',
    '-l',
  ]);
  if (args.some((argument) => readActions.has(argument))) {
    return true;
  }

  const optionsWithValue = new Set(['--file', '--fixed-value', '--type']);
  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (optionsWithValue.has(argument)) {
      index += 1;
    } else if (!argument.startsWith('-')) {
      positional.push(argument);
    }
  }
  return positional.length <= 1;
}

function parseGitInvocation(tokens, gitIndex) {
  let index = gitIndex + 1;
  while (index < tokens.length) {
    const argument = tokens[index];
    if (gitGlobalOptionsWithValue.has(argument)) {
      index += 2;
      continue;
    }
    if (
      gitGlobalOptionsWithoutValue.has(argument) ||
      /^(?:--config-env|--exec-path|--git-dir|--namespace|--super-prefix|--work-tree)=/u.test(
        argument,
      )
    ) {
      index += 1;
      continue;
    }
    break;
  }

  const subcommand = tokens[index];
  return {
    args: subcommand ? tokens.slice(index + 1) : [],
    subcommand,
  };
}

function isReadOnlyGitInvocation(tokens, gitIndex) {
  const { args, subcommand } = parseGitInvocation(tokens, gitIndex);
  if (!subcommand) {
    return true;
  }
  if (readOnlyGitSubcommands.has(subcommand)) {
    return true;
  }
  if (subcommand === 'branch') {
    return args.length === 1 && args[0] === '--show-current';
  }
  if (subcommand === 'config') {
    return isReadOnlyGitConfig(args);
  }
  return false;
}

function hasUnapprovedGitCommand(command) {
  for (const tokens of splitShellSegments(command)) {
    for (let index = 0; index < tokens.length; index += 1) {
      if (path.basename(tokens[index]) === 'git' && !isReadOnlyGitInvocation(tokens, index)) {
        return true;
      }
    }
  }
  return false;
}

function isWriteCommand(command) {
  return (
    writeCommandPattern.test(command) ||
    hasUnapprovedGitCommand(command) ||
    hasFileOutputRedirect(command)
  );
}

function isContextCollectorInvocation(tokens) {
  return tokens.some(
    (token) => path.basename(token) === 'collect-review-context.mjs',
  );
}

function isEquivalentCollectorGitRead(tokens, gitIndex) {
  const { args, subcommand } = parseGitInvocation(tokens, gitIndex);
  if (subcommand === 'status' || subcommand === 'diff') {
    return true;
  }
  if (subcommand === 'ls-files') {
    return args.some((argument) => argument === '--others' || argument === '-o');
  }
  if (subcommand === 'rev-parse') {
    return args.some(
      (argument) => argument === 'HEAD' || argument === '--show-toplevel',
    );
  }
  return false;
}

function inspectContextCollectorContract(commands, required, violations) {
  let collectorCallCount = 0;
  const equivalentGitReads = [];

  for (const { command, line } of commands) {
    for (const tokens of splitShellSegments(command)) {
      if (isContextCollectorInvocation(tokens)) {
        collectorCallCount += 1;
      }

      for (let index = 0; index < tokens.length; index += 1) {
        if (
          path.basename(tokens[index]) === 'git' &&
          isEquivalentCollectorGitRead(tokens, index)
        ) {
          equivalentGitReads.push({ command, line });
          break;
        }
      }
    }
  }

  if (required && collectorCallCount !== 1) {
    violations.push({
      actual: collectorCallCount,
      expected: 1,
      type: 'context-collector-count',
    });
  }
  if (required) {
    for (const read of equivalentGitReads) {
      violations.push({
        ...read,
        type: 'context-collector-equivalent-git-read',
      });
    }
  }

  return {
    collectorCallCount,
    equivalentGitReads,
    required,
    valid:
      !required ||
      (collectorCallCount === 1 && equivalentGitReads.length === 0),
  };
}

function inspectToolCall(toolCall, workspace, lineNumber, commands, violations) {
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
      commands.push({ command: unwrapShellCommand(args.command), line: lineNumber });
      inspectShellCommand(args.command, workspace, lineNumber, violations);

      if (isWriteCommand(args.command)) {
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

function inspectCommandExecution(
  event,
  workspace,
  lineNumber,
  seenCommands,
  commands,
  violations,
) {
  if (
    (event.type !== 'item.started' && event.type !== 'item.completed') ||
    event.item?.type !== 'command_execution' ||
    typeof event.item.command !== 'string'
  ) {
    return 0;
  }

  const identity =
    typeof event.item.id === 'string'
      ? `id:${event.item.id}`
      : `command:${event.item.command}`;
  if (seenCommands.has(identity)) {
    return 0;
  }
  seenCommands.add(identity);

  const command = unwrapShellCommand(event.item.command);
  commands.push({ command, line: lineNumber });
  inspectShellCommand(command, workspace, lineNumber, violations);
  if (isWriteCommand(command)) {
    violations.push({
      command: event.item.command,
      line: lineNumber,
      type: 'write-command',
    });
  }

  return 1;
}

function normalizeMcpArguments(value) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function normalizeToolName(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/gu, '$1_$2')
    .replace(/[^A-Za-z0-9]+/gu, '_')
    .toLowerCase();
}

function inspectMcpArgumentPaths(value, workspace, lineNumber, violations, key = '') {
  if (Array.isArray(value)) {
    for (const entry of value) {
      inspectMcpArgumentPaths(entry, workspace, lineNumber, violations, key);
    }
    return;
  }
  if (!value || typeof value !== 'object') {
    if (mcpPathArgumentKeys.has(key.toLowerCase()) && typeof value === 'string') {
      inspectRequestedPath(value, workspace, lineNumber, violations);
    }
    return;
  }
  for (const [nestedKey, nestedValue] of Object.entries(value)) {
    inspectMcpArgumentPaths(nestedValue, workspace, lineNumber, violations, nestedKey);
  }
}

function inspectMcpToolCall(
  event,
  workspace,
  lineNumber,
  mcpToolCalls,
  allowedMcpTools,
  violations,
) {
  if (
    (event.type !== 'item.started' && event.type !== 'item.completed') ||
    event.item?.type !== 'mcp_tool_call'
  ) {
    return;
  }

  const identity =
    typeof event.item.id === 'string'
      ? `id:${event.item.id}`
      : `${event.item.server ?? 'unknown'}:${event.item.tool ?? 'unknown'}:${lineNumber}`;
  const firstEvent = !mcpToolCalls.has(identity);
  const current = mcpToolCalls.get(identity) ?? {
    error: null,
    id: event.item.id ?? null,
    line: lineNumber,
    server: event.item.server ?? null,
    status: event.item.status ?? null,
    tool: event.item.tool ?? null,
  };

  current.error = event.item.error ?? current.error;
  current.status = event.item.status ?? current.status;
  mcpToolCalls.set(identity, current);

  if (!firstEvent) {
    return;
  }

  const server = event.item.server ?? 'unknown';
  const tool = event.item.tool ?? 'unknown';
  const qualifiedTool = `${server}/${tool}`;
  if (!allowedMcpTools.has(qualifiedTool)) {
    violations.push({ line: lineNumber, server, tool, type: 'unapproved-mcp-tool' });
  }
  if (mcpWriteToolPattern.test(normalizeToolName(tool))) {
    violations.push({ line: lineNumber, server, tool, type: 'write-tool' });
  }

  const args = normalizeMcpArguments(event.item.arguments);
  if (args === null) {
    violations.push({ line: lineNumber, server, tool, type: 'uninspectable-mcp-arguments' });
  } else {
    inspectMcpArgumentPaths(args, workspace, lineNumber, violations);
  }
}

function normalizeGitStatus(content) {
  return content
    .split(/\r?\n/u)
    .filter(Boolean)
    .sort();
}

function inspectWorkspaceStatus(workspace, baselineStatusPath, violations) {
  if (!baselineStatusPath) {
    return {
      added: [],
      checked: false,
      removed: [],
      unchanged: null,
    };
  }

  const before = normalizeGitStatus(fs.readFileSync(baselineStatusPath, 'utf8'));
  const status = spawnSync(
    'git',
    ['-C', workspace, 'status', '--short', '--untracked-files=all'],
    { encoding: 'utf8' },
  );
  if (status.status !== 0) {
    throw new Error(`Unable to read workspace Git status: ${status.stderr.trim()}`);
  }

  const after = normalizeGitStatus(status.stdout);
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const added = after.filter((entry) => !beforeSet.has(entry));
  const removed = before.filter((entry) => !afterSet.has(entry));

  if (added.length > 0 || removed.length > 0) {
    violations.push({
      added,
      removed,
      type: 'workspace-status-drift',
    });
  }

  return {
    added,
    checked: true,
    removed,
    unchanged: added.length === 0 && removed.length === 0,
  };
}

function readTokenUsage(event) {
  if (event.type !== 'turn.completed' || !event.usage || typeof event.usage !== 'object') {
    return null;
  }

  const readNumber = (key) => {
    const value = event.usage[key];
    return Number.isFinite(value) ? value : null;
  };
  const inputTokens = readNumber('input_tokens');
  const cachedInputTokens = readNumber('cached_input_tokens');

  return {
    cacheWriteInputTokens: readNumber('cache_write_input_tokens'),
    cachedInputTokens,
    inputTokens,
    outputTokens: readNumber('output_tokens'),
    reasoningOutputTokens: readNumber('reasoning_output_tokens'),
    uncachedInputTokens:
      inputTokens === null || cachedInputTokens === null
        ? null
        : Math.max(0, inputTokens - cachedInputTokens),
  };
}

function auditTrace(
  tracePath,
  workspace,
  baselineStatusPath,
  elapsedSeconds,
  allowedMcpTools,
  requireContextCollector,
) {
  const content = fs.readFileSync(tracePath, 'utf8');
  const violations = [];
  let eventCount = 0;
  let commandExecutionCount = 0;
  let finalResponse = '';
  let legacyToolCallCount = 0;
  const mcpToolCalls = new Map();
  const commands = [];
  const seenCommands = new Set();
  let tokenUsage = null;

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
      legacyToolCallCount += inspectToolCall(
        event.tool_call,
        workspace,
        index + 1,
        commands,
        violations,
      );
    }
    commandExecutionCount += inspectCommandExecution(
      event,
      workspace,
      index + 1,
      seenCommands,
      commands,
      violations,
    );
    inspectMcpToolCall(
      event,
      workspace,
      index + 1,
      mcpToolCalls,
      allowedMcpTools,
      violations,
    );

    if (event.type === 'item.completed' && event.item?.type === 'agent_message') {
      finalResponse = typeof event.item.text === 'string' ? event.item.text : '';
    }

    tokenUsage = readTokenUsage(event) ?? tokenUsage;
  }

  const mcpToolCallSummaries = [...mcpToolCalls.values()];
  const mcpToolFailureCount = mcpToolCallSummaries.filter(
    ({ error, status }) => error || status === 'failed',
  ).length;
  const workspaceStatus = inspectWorkspaceStatus(
    workspace,
    baselineStatusPath,
    violations,
  );
  const contextCollector = inspectContextCollectorContract(
    commands,
    requireContextCollector,
    violations,
  );

  return {
    allowedMcpTools: [...allowedMcpTools].sort(),
    commandExecutionCount,
    contextCollector,
    elapsedSeconds,
    eventCount,
    finalResponseCharacters: finalResponse ? finalResponse.length : null,
    finalResponseLines: finalResponse ? finalResponse.split(/\r?\n/u).length : null,
    legacyToolCallCount,
    mcpToolCallCount: mcpToolCallSummaries.length,
    mcpToolCalls: mcpToolCallSummaries,
    mcpToolFailureCount,
    toolCallCount:
      legacyToolCallCount + commandExecutionCount + mcpToolCallSummaries.length,
    tokenUsage,
    tracePath,
    valid: violations.length === 0,
    violations,
    workspace,
    workspaceStatus,
  };
}

try {
  const {
    allowedMcpTools,
    baselineStatusPath,
    elapsedSeconds,
    requireContextCollector,
    tracePath,
    workspace,
  } = parseArguments(process.argv.slice(2));
  const result = auditTrace(
    tracePath,
    workspace,
    baselineStatusPath,
    elapsedSeconds,
    allowedMcpTools,
    requireContextCollector,
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.valid ? 0 : 1;
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 2;
}

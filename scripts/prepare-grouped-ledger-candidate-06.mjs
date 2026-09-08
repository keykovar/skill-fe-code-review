#!/usr/bin/env node

import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { buildGroupedLedgerCandidate06 } from './build-grouped-ledger-candidate-06.mjs';
import { hashCursorEvaluationTreeV3 } from './run-cursor-evaluation-v3.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixedGitDate = '2026-08-27T00:00:00Z';
const runs = [
  { caseId: 'D-ID-001', mode: 'deep-identity', runId: 'RUN-01' },
  { caseId: 'Q-ID-001', mode: 'quick-identity', runId: 'RUN-01' },
  { caseId: 'Q-ID-001', mode: 'quick-identity', runId: 'RUN-02' },
  { caseId: 'Q-ID-002', mode: 'quick-independent', runId: 'RUN-01' },
  { caseId: 'F-ID-001', mode: 'fix-identity', runId: 'RUN-01' },
  { caseId: 'F-ID-001', mode: 'fix-identity', runId: 'RUN-02' },
  { caseId: 'K-ID-001', mode: 'quick-keep', runId: 'RUN-01' },
];

function usage() {
  return 'Usage: node scripts/prepare-grouped-ledger-candidate-06.mjs --output <directory> --cursor-executable <absolute-file> --git-executable <absolute-file>';
}

function parseArguments(argv) {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  const required = ['--cursor-executable', '--git-executable', '--output'];
  const options = {};
  for (let index = 0; index < normalized.length; index += 2) {
    const name = normalized[index];
    const value = normalized[index + 1];
    if (!required.includes(name) || !value || Object.hasOwn(options, name)) {
      throw new Error(usage());
    }
    options[name] = value;
  }
  if (required.some((name) => !options[name])) {
    throw new Error(usage());
  }
  return options;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function requireAbsoluteExecutable(value, label) {
  if (!path.isAbsolute(value)) {
    throw new Error(`${label} must be an absolute path.`);
  }
  const executable = fs.realpathSync(path.resolve(value));
  if (!fs.statSync(executable).isFile()) {
    throw new Error(`${label} must be a file.`);
  }
  fs.accessSync(executable, fs.constants.X_OK);
  return executable;
}

function requireEmptyDirectory(directory) {
  if (fs.existsSync(directory) && fs.readdirSync(directory).length > 0) {
    throw new Error(`Output directory must be empty: ${directory}`);
  }
  fs.mkdirSync(directory, { recursive: true });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? rootDir,
    encoding: 'utf8',
    env: options.env ?? process.env,
    maxBuffer: 64 * 1024 * 1024,
    shell: false,
    timeout: options.timeout ?? 60_000,
  });
  if (result.error) {
    throw result.error;
  }
  return result;
}

function requireSuccess(result, label) {
  if (result.status !== 0) {
    throw new Error(`${label} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout.trimEnd();
}

function promptFor(basePrompt, mode) {
  const common =
    '允许且应执行一次声明的确定性测试 `node --test`。可按需读取已识别的变更文件、对应基线、直接调用方和测试，但不得读取工作区外路径、Cursor 会话/日志、oracle、evaluation、examples/outputs 或历史 trace。不得调用写入、编辑、删除、计划写入或 MCP 工具，不得修改任何文件、Git 状态、分支或配置。任何命令失败或被拒绝都不得重试；请保留证据边界并输出最终 Review。';
  if (mode === 'deep-identity') {
    return `${basePrompt} 评测约束：本 Deep Review 不使用 context collector；使用必要且只读的 Git 命令核验 main...HEAD 比较基线、提交差异、当前分支和工作区状态，不得使用不受支持的 collector 参数。${common}`;
  }
  return `${basePrompt} 评测约束：必须且只能执行一次 \`node .cursor/skills/fe-code-review/scripts/collect-review-context.mjs --workspace "$PWD"\`；该输出替代 \`git status\`、\`git diff\`、\`git diff --cached\`、未跟踪文件清单、\`git diff --check\`、HEAD 与仓库根目录等价读取，禁止单独或重复执行这些 Git inventory。${common}`;
}

function slug({ caseId, runId }) {
  return `${caseId}-${runId}`.toLowerCase();
}

function gitValue(gitExecutable, workspace, args, label) {
  return requireSuccess(run(gitExecutable, args, { cwd: workspace }), label);
}

function prepareWorkspace(runDefinition, directories, candidate, gitExecutable) {
  const workspace = path.join(directories.workspaces, slug(runDefinition));
  const preparation = run(
    process.execPath,
    [
      path.join(rootDir, 'scripts', 'prepare-evaluation-fixture.mjs'),
      runDefinition.mode,
      '--output',
      workspace,
      '--skill-source',
      candidate.skillDir,
    ],
    {
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: fixedGitDate,
        GIT_COMMITTER_DATE: fixedGitDate,
        LANG: 'C',
        LC_ALL: 'C',
      },
    },
  );
  const prepared = JSON.parse(
    requireSuccess(preparation, `${runDefinition.caseId} fixture preparation`),
  );
  const prompt = promptFor(prepared.prompt, runDefinition.mode);
  const promptPath = path.join(directories.prompts, `${slug(runDefinition)}.txt`);
  fs.writeFileSync(promptPath, prompt, { flag: 'wx' });

  const statusBeforeTest = gitValue(
    gitExecutable,
    workspace,
    ['status', '--short', '--untracked-files=all'],
    `${runDefinition.caseId} status before test`,
  );
  const test = run(process.execPath, ['--test'], { cwd: workspace });
  const expectedTestExitCode = prepared.expectedTestResult === 'pass' ? 0 : 1;
  if (test.status !== expectedTestExitCode) {
    throw new Error(
      `${runDefinition.caseId} test exit mismatch: expected ${expectedTestExitCode}, received ${test.status}.`,
    );
  }
  const statusAfterTest = gitValue(
    gitExecutable,
    workspace,
    ['status', '--short', '--untracked-files=all'],
    `${runDefinition.caseId} status after test`,
  );
  if (statusAfterTest !== statusBeforeTest) {
    throw new Error(`${runDefinition.caseId} test changed the frozen Git status.`);
  }

  const workspaceTree = hashCursorEvaluationTreeV3(workspace);
  const agentSkillTree = hashCursorEvaluationTreeV3(
    path.join(workspace, '.agents', 'skills', 'fe-code-review'),
  );
  const cursorSkillTree = hashCursorEvaluationTreeV3(
    path.join(workspace, '.cursor', 'skills', 'fe-code-review'),
  );
  if (
    agentSkillTree.sha256 !== cursorSkillTree.sha256 ||
    cursorSkillTree.sha256 !== candidate.skillTree.sha256
  ) {
    throw new Error(`${runDefinition.caseId} frozen Skill trees differ.`);
  }

  return {
    ...runDefinition,
    actualTestExitCode: test.status,
    branch: gitValue(
      gitExecutable,
      workspace,
      ['branch', '--show-current'],
      `${runDefinition.caseId} branch`,
    ),
    collectorRequired: runDefinition.mode !== 'deep-identity',
    expectedCollectorCalls: runDefinition.mode === 'deep-identity' ? 0 : 1,
    expectedTestExitCode,
    head: gitValue(
      gitExecutable,
      workspace,
      ['rev-parse', 'HEAD'],
      `${runDefinition.caseId} HEAD`,
    ),
    promptCharacters: prompt.length,
    promptPath,
    promptSha256: sha256(prompt),
    skillTreeSha256: cursorSkillTree.sha256,
    status: statusAfterTest ? statusAfterTest.split('\n') : [],
    statusSha256: sha256(statusAfterTest ? `${statusAfterTest}\n` : ''),
    testStderrSha256: sha256(test.stderr ?? ''),
    testStdoutSha256: sha256(test.stdout ?? ''),
    workspace,
    workspaceFileCount: workspaceTree.fileCount,
    workspaceTreeSha256: workspaceTree.sha256,
  };
}

function assertRepeatIdentity(preparedRuns, caseId) {
  const pair = preparedRuns.filter((runDefinition) => runDefinition.caseId === caseId);
  if (
    pair.length !== 2 ||
    pair[0].head !== pair[1].head ||
    pair[0].workspaceTreeSha256 !== pair[1].workspaceTreeSha256 ||
    pair[0].promptSha256 !== pair[1].promptSha256
  ) {
    throw new Error(`${caseId} repeat pair is not byte-identical.`);
  }
  return {
    caseId,
    head: pair[0].head,
    promptSha256: pair[0].promptSha256,
    runs: pair.map(({ runId }) => runId),
    workspaceTreeSha256: pair[0].workspaceTreeSha256,
  };
}

function addPreflight(runDefinition, runner, client, gitExecutable) {
  return {
    ...runDefinition,
    preflight: {
      baseArguments: {
        executable: client.executable,
        expectedPromptSha256: runDefinition.promptSha256,
        promptFile: runDefinition.promptPath,
        workspace: runDefinition.workspace,
      },
      preflightArguments: {
        expectedBranch: runDefinition.branch,
        expectedClientVersion: client.version,
        expectedHead: runDefinition.head,
        expectedRunnerSha256: runner.sha256,
        expectedSkillTreeSha256: runDefinition.skillTreeSha256,
        expectedStatusSha256: runDefinition.statusSha256,
        expectedWorkspaceTreeSha256: runDefinition.workspaceTreeSha256,
        gitExecutable,
      },
    },
  };
}

export function prepareCandidate06(
  requestedOutput,
  requestedCursorExecutable,
  requestedGitExecutable,
) {
  const outputDir = path.resolve(requestedOutput);
  requireEmptyDirectory(outputDir);
  const cursorExecutable = requireAbsoluteExecutable(
    requestedCursorExecutable,
    'Cursor executable',
  );
  const gitExecutable = requireAbsoluteExecutable(requestedGitExecutable, 'Git executable');
  const directories = {
    candidate: path.join(outputDir, 'candidate'),
    control: path.join(outputDir, 'control'),
    prompts: path.join(outputDir, 'control', 'prompts'),
    workspaces: path.join(outputDir, 'workspaces'),
  };
  fs.mkdirSync(directories.prompts, { recursive: true });
  fs.mkdirSync(directories.workspaces, { recursive: true });

  const candidate = buildGroupedLedgerCandidate06(directories.candidate);
  const runnerPath = path.join(rootDir, 'scripts', 'run-cursor-evaluation-v3.mjs');
  const runner = {
    path: runnerPath,
    sha256: sha256(fs.readFileSync(runnerPath)),
  };
  const client = {
    executable: cursorExecutable,
    version: requireSuccess(run(cursorExecutable, ['--version']), 'Cursor version check'),
  };
  const preparedRuns = runs
    .map((runDefinition) =>
      prepareWorkspace(runDefinition, directories, candidate, gitExecutable),
    )
    .map((runDefinition) => addPreflight(runDefinition, runner, client, gitExecutable));

  const manifest = {
    schemaVersion: 1,
    candidate: 'post-v0.4.0-grouped-ledger-candidate-06',
    preparedDate: '2026-08-28',
    status: 'offline-freeze-complete-source-free-probe-not-authorized',
    predecessor: {
      candidate: 'post-v0.4.0-grouped-ledger-candidate-05',
      decision: 'No-Go',
      reason: 'Cursor could not honor auto-review and generated decorated grouped-ledger prefixes.',
      retried: false,
      reinterpreted: false,
    },
    outputDir,
    artifacts: candidate,
    client,
    runner,
    clientContract: {
      argumentsBeforePrompt: [
        '--print',
        '--output-format',
        'stream-json',
        '--mode',
        'ask',
        '--sandbox',
        'enabled',
        '--trust',
        '--workspace',
        '<workspace>',
      ],
      forbiddenFlags: ['--auto-review', '--force', '--yolo', '--approve-mcps'],
      permissionFallbackAllowed: false,
      stderrWarningAllowed: false,
    },
    preflightContract: {
      implementation: 'single Node process with absolute Git and Cursor executables',
      shell: false,
      checks: [
        'runner SHA-256',
        'Prompt SHA-256',
        'Cursor version',
        'Git HEAD',
        'Git branch',
        'Git status SHA-256',
        'workspace tree SHA-256',
        'Cursor Skill tree SHA-256',
        'fresh output paths outside workspace',
      ],
      adHocShellPreflightAllowed: false,
      zshPathIndependent: true,
    },
    promptContract: {
      deep: 'normal read-only main...HEAD Git evidence; collector forbidden and expected 0 times',
      quickFix: 'supported --workspace-only collector required exactly once',
      transport: 'one literal final Prompt argv value',
    },
    generationBoundary: {
      source: 'Candidate 06 deterministic offline builder and fresh fixture preparation',
      freshOutputDirectory: true,
      runtimeResultsCarriedForward: false,
      sourceFreeResultCarriedForward: false,
      sourceBearingResultCarriedForward: false,
    },
    fixedGitDate,
    preparedRuns,
    repeatAssertions: [
      assertRepeatIdentity(preparedRuns, 'Q-ID-001'),
      assertRepeatIdentity(preparedRuns, 'F-ID-001'),
    ],
    sourcePolicy: {
      externalModelRequests: 0,
      privateSourceAllowed: false,
      sourceBearingAuthorized: false,
      sourceFreeProbeAuthorized: false,
      sourceTransmitted: false,
      visibility: 'public-synthetic-only',
    },
  };
  const manifestPath = path.join(directories.control, 'freeze-manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  return { ...manifest, manifestPath, manifestSha256: sha256(fs.readFileSync(manifestPath)) };
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    const result = prepareCandidate06(
      options['--output'],
      options['--cursor-executable'],
      options['--git-executable'],
    );
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}

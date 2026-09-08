#!/usr/bin/env node

import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { hashCursorEvaluationTreeV5 } from './run-cursor-evaluation-v5.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixedGitDate = '2026-08-27T00:00:00Z';
const candidate13Runs = [
  { caseId: 'D-ID-001', mode: 'deep-identity', runId: 'RUN-01' },
  { caseId: 'Q-ID-001', mode: 'quick-identity', runId: 'RUN-01' },
  { caseId: 'Q-ID-001', mode: 'quick-identity', runId: 'RUN-02' },
  { caseId: 'Q-ID-002', mode: 'quick-independent', runId: 'RUN-01' },
  { caseId: 'F-ID-001', mode: 'fix-identity', runId: 'RUN-01' },
  { caseId: 'F-ID-001', mode: 'fix-identity', runId: 'RUN-02' },
  { caseId: 'K-ID-001', mode: 'quick-keep', runId: 'RUN-01' },
];
const candidate13Definition = {
  candidate: 'post-v0.4.0-grouped-ledger-candidate-13',
  preparedDate: '2026-09-04',
  status: 'offline-freeze-complete-source-free-probe-passed-source-bearing-not-authorized',
  predecessor: {
    candidate: 'post-v0.4.0-grouped-ledger-candidate-12',
    decision: 'No-Go',
    reason: 'Candidate 12 source-bearing Deep output failed the Coverage before -> after contract; Candidate 13 tightens only the output instruction and adds offline fixtures.',
    retried: false,
    reinterpreted: false,
  },
  repeatCaseIds: ['Q-ID-001', 'F-ID-001'],
  runs: candidate13Runs,
  sourceFreeProbePassed: true,
};

function usage() {
  return 'Usage: node scripts/prepare-grouped-ledger-candidate-13.mjs --output <directory> --cursor-executable <absolute-file> --git-executable <absolute-file> --skill-source <directory>';
}

function parseArguments(argv) {
  const normalized = argv[0] === '--' ? argv.slice(1) : argv;
  const required = ['--cursor-executable', '--git-executable', '--output', '--skill-source'];
  const options = {};
  for (let index = 0; index < normalized.length; index += 2) {
    const name = normalized[index];
    const value = normalized[index + 1];
    if (!required.includes(name) || !value || Object.hasOwn(options, name)) {
      throw new Error(usage());
    }
    options[name] = value;
  }
  if (required.some((name) => !options[name]) || normalized.length !== required.length * 2) {
    throw new Error(usage());
  }
  return options;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function requireAbsoluteFile(value, label, executable = false) {
  if (!path.isAbsolute(value)) throw new Error(`${label} must be an absolute path.`);
  const resolved = fs.realpathSync(path.resolve(value));
  if (!fs.statSync(resolved).isFile()) throw new Error(`${label} must be a file.`);
  if (executable) fs.accessSync(resolved, fs.constants.X_OK);
  return resolved;
}

function requireDirectory(value, label) {
  const resolved = fs.realpathSync(path.resolve(value));
  if (!fs.statSync(resolved).isDirectory()) throw new Error(`${label} must be a directory.`);
  return resolved;
}

function requireEmptyDirectory(value) {
  if (fs.existsSync(value) && fs.readdirSync(value).length > 0) {
    throw new Error(`Output directory must be empty: ${value}`);
  }
  fs.mkdirSync(value, { recursive: true });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? rootDir,
    encoding: 'utf8',
    env: options.env ?? process.env,
    maxBuffer: 64 * 1024 * 1024,
    shell: false,
    timeout: options.timeout ?? 120_000,
  });
  if (result.error) throw result.error;
  return result;
}

function requireSuccess(result, label) {
  if (result.status !== 0) throw new Error(`${label} failed:\n${result.stderr || result.stdout}`);
  return result.stdout.trimEnd();
}

function gitValue(gitExecutable, workspace, args, label) {
  return requireSuccess(run(gitExecutable, args, { cwd: workspace }), label);
}

function slug({ caseId, runId }) {
  return `${caseId}-${runId}`.toLowerCase();
}

function replaceWorkspaceRoot(value, workspace) {
  const workspacePaths = [...new Set([fs.realpathSync(workspace), path.resolve(workspace)])]
    .sort((left, right) => right.length - left.length);
  return workspacePaths.reduce(
    (normalized, workspacePath) => normalized.split(workspacePath).join('<workspace>'),
    value,
  );
}

function freezeDeepInventory(gitExecutable, workspace) {
  return {
    branch: gitValue(gitExecutable, workspace, ['branch', '--show-current'], 'Deep branch'),
    head: gitValue(gitExecutable, workspace, ['rev-parse', 'HEAD'], 'Deep HEAD'),
    comparison: 'main...HEAD',
    status: gitValue(gitExecutable, workspace, ['status', '--short', '--untracked-files=all'], 'Deep status'),
    changedFiles: gitValue(gitExecutable, workspace, ['diff', '--name-status', 'main...HEAD'], 'Deep changed files'),
    diffStat: gitValue(gitExecutable, workspace, ['diff', '--stat', 'main...HEAD'], 'Deep diff stat'),
    diffCheck: gitValue(gitExecutable, workspace, ['diff', '--check', 'main...HEAD'], 'Deep diff check'),
  };
}

function buildPromptSafetyInstruction(profile) {
  if (profile === undefined) return '';
  if (profile !== 'workspace-relative-stop-on-failure') {
    throw new Error(`Unsupported evaluator Prompt safety profile: ${profile}`);
  }
  return (
    ' 每个只读文件工具调用的 `path` 参数必须直接使用相对于当前 workspace 根目录的路径，例如 `tests/contracts.test.mjs`。' +
    '不得在文件工具参数中填写、拼接、复制、猜测或修正绝对 workspace 路径，也不得使用 `..`、`~`、`file://` 或 `<workspace>` 作为文件工具路径。' +
    '任何工具调用首次失败或被拒绝后，立即停止所有后续工具调用，基于已取得的证据完成 Review 并记录证据限制；不得使用修正路径、替代路径、绝对路径、其他工具或重复调用进行重试。'
  );
}

function buildPrompt(prepared, runDefinition, evidence, promptSafetyProfile) {
  const testEvidence =
    `离线 evaluator 已在冻结前执行一次声明的确定性测试 \`node --test\`，实际退出码为 ${evidence.test.exitCode}。` +
    '完整 stdout/stderr 仅以 SHA-256 保存在本地冻结清单中，不发送给模型；Cursor 不得再次执行测试。';
  const common =
    `${testEvidence} 仅可使用 workspace 内的只读文件工具读取已识别的变更、基线、直接调用方和测试；不得读取 workspace 外路径、Cursor 会话/日志、oracle、evaluation、examples/outputs 或历史 trace。不得调用 Shell、MCP、写入、编辑、删除、计划写入或其他非读取工具，不得修改文件、Git 状态、分支或配置。任何工具失败或拒绝都不得重试；请保留证据边界并输出最终 Review。${buildPromptSafetyInstruction(promptSafetyProfile)}`;
  if (runDefinition.mode === 'deep-identity') {
    return `${prepared.prompt} 评测约束：以下 Git inventory 和 review scope 由离线 evaluator 冻结并作为唯一 Git 元数据证据；不要执行 Git 命令或 context collector。冻结 inventory：\n\n${JSON.stringify(evidence.gitInventory, null, 2)}\n\n${common}`;
  }
  return `${prepared.prompt} 评测约束：以下是离线 evaluator 在冻结前唯一执行一次的 context collector 输出，作为 Git inventory 和变更上下文的唯一证据；不要再次执行 collector、Git 命令或测试。冻结 collector 输出：\n\n${evidence.collectorCanonical}\n\n${common}`;
}

function prepareRun(
  runDefinition,
  directories,
  skillSource,
  gitExecutable,
  promptSafetyProfile,
) {
  const workspace = path.join(directories.workspaces, slug(runDefinition));
  const preparation = run(
    process.execPath,
    [
      path.join(rootDir, 'scripts', 'prepare-evaluation-fixture.mjs'),
      runDefinition.mode,
      '--output',
      workspace,
      '--skill-source',
      skillSource,
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
  const prepared = JSON.parse(requireSuccess(preparation, `${runDefinition.caseId} fixture preparation`));
  const statusBeforeTest = gitValue(
    gitExecutable,
    workspace,
    ['status', '--short', '--untracked-files=all'],
    `${runDefinition.caseId} status before test`,
  );
  const test = run(process.execPath, ['--test'], { cwd: workspace });
  const expectedTestExitCode = prepared.expectedTestResult === 'pass' ? 0 : 1;
  if (test.status !== expectedTestExitCode) {
    throw new Error(`${runDefinition.caseId} test exit mismatch: expected ${expectedTestExitCode}, received ${test.status}.`);
  }
  const statusAfterTest = gitValue(
    gitExecutable,
    workspace,
    ['status', '--short', '--untracked-files=all'],
    `${runDefinition.caseId} status after test`,
  );
  if (statusAfterTest !== statusBeforeTest) throw new Error(`${runDefinition.caseId} test changed Git status.`);

  const testEvidence = {
    exitCode: test.status,
    stdoutSha256: sha256(test.stdout ?? ''),
    stderrSha256: sha256(test.stderr ?? ''),
  };
  let collectorCalls = 0;
  let collectorCanonical = null;
  let collectorRawSha256 = null;
  let gitInventory = null;
  if (runDefinition.mode === 'deep-identity') {
    gitInventory = freezeDeepInventory(gitExecutable, workspace);
  } else {
    const collector = run(
      process.execPath,
      [path.join(workspace, '.cursor', 'skills', 'fe-code-review', 'scripts', 'collect-review-context.mjs'), '--workspace', workspace],
      { cwd: workspace },
    );
    collectorCalls = 1;
    const raw = requireSuccess(collector, `${runDefinition.caseId} context collector`);
    collectorRawSha256 = sha256(`${raw}\n`);
    collectorCanonical = replaceWorkspaceRoot(raw, workspace);
  }

  const evidence = { test: testEvidence, collectorCanonical, gitInventory };
  const prompt = buildPrompt(prepared, runDefinition, evidence, promptSafetyProfile);
  const promptPath = path.join(directories.prompts, `${slug(runDefinition)}.txt`);
  fs.writeFileSync(promptPath, prompt, { flag: 'wx' });
  if (collectorCanonical !== null) {
    const collectorPath = path.join(directories.collectors, `${slug(runDefinition)}.json`);
    fs.writeFileSync(collectorPath, `${collectorCanonical}\n`, { flag: 'wx' });
  }

  const workspaceTree = hashCursorEvaluationTreeV5(workspace);
  const cursorSkillTree = hashCursorEvaluationTreeV5(
    path.join(workspace, '.cursor', 'skills', 'fe-code-review'),
  );
  const agentSkillTree = hashCursorEvaluationTreeV5(
    path.join(workspace, '.agents', 'skills', 'fe-code-review'),
  );
  if (cursorSkillTree.sha256 !== agentSkillTree.sha256) throw new Error(`${runDefinition.caseId} Skill copies differ.`);

  return {
    ...runDefinition,
    workspace,
    branch: gitValue(gitExecutable, workspace, ['branch', '--show-current'], `${runDefinition.caseId} branch`),
    head: gitValue(gitExecutable, workspace, ['rev-parse', 'HEAD'], `${runDefinition.caseId} HEAD`),
    status: statusAfterTest ? statusAfterTest.split('\n') : [],
    statusSha256: sha256(statusAfterTest ? `${statusAfterTest}\n` : ''),
    workspaceFileCount: workspaceTree.fileCount,
    workspaceTreeSha256: workspaceTree.sha256,
    skillTreeSha256: cursorSkillTree.sha256,
    promptPath,
    promptCharacters: prompt.length,
    promptSha256: sha256(prompt),
    collectorCallsExecuted: collectorCalls,
    collectorExpectedByCursor: 0,
    collectorPath: collectorCanonical === null ? null : path.join(directories.collectors, `${slug(runDefinition)}.json`),
    collectorRawSha256,
    testCommand: 'node --test',
    testExitCode: testEvidence.exitCode,
    testStdoutSha256: testEvidence.stdoutSha256,
    testStderrSha256: testEvidence.stderrSha256,
    expectedTestExitCode,
    gitInventory,
    sourcePolicy: 'public-synthetic-only',
  };
}

function repeatAssertion(preparedRuns, caseId) {
  const pair = preparedRuns.filter((runDefinition) => runDefinition.caseId === caseId);
  if (pair.length !== 2) throw new Error(`${caseId} repeat pair is incomplete.`);
  const comparable = ['head', 'promptSha256', 'statusSha256', 'workspaceTreeSha256'];
  for (const key of comparable) {
    if (pair[0][key] !== pair[1][key]) throw new Error(`${caseId} repeat pair differs at ${key}.`);
  }
  return {
    caseId,
    runs: pair.map(({ runId }) => runId),
    head: pair[0].head,
    promptSha256: pair[0].promptSha256,
    statusSha256: pair[0].statusSha256,
    workspaceTreeSha256: pair[0].workspaceTreeSha256,
  };
}

export function prepareGroupedLedgerCandidate(
  requestedOutput,
  requestedCursorExecutable,
  requestedGitExecutable,
  requestedSkillSource,
  definition,
) {
  const outputDir = path.resolve(requestedOutput);
  requireEmptyDirectory(outputDir);
  const cursorExecutable = requireAbsoluteFile(requestedCursorExecutable, 'Cursor executable', true);
  const gitExecutable = requireAbsoluteFile(requestedGitExecutable, 'Git executable', true);
  const skillSource = requireDirectory(requestedSkillSource, 'Skill source');
  if (!fs.existsSync(path.join(skillSource, 'SKILL.md'))) throw new Error('Skill source must contain SKILL.md.');

  const directories = {
    outputDir,
    prompts: path.join(outputDir, 'control', 'prompts'),
    collectors: path.join(outputDir, 'control', 'collectors'),
    workspaces: path.join(outputDir, 'workspaces'),
  };
  fs.mkdirSync(directories.prompts, { recursive: true });
  fs.mkdirSync(directories.collectors, { recursive: true });
  fs.mkdirSync(directories.workspaces, { recursive: true });

  const clientVersion = requireSuccess(run(cursorExecutable, ['--version']), 'Cursor version check');
  const runnerPath = path.join(rootDir, 'scripts', 'run-cursor-evaluation-v5.mjs');
  const seatbeltPath = path.join(rootDir, 'evaluation', 'profiles', 'cursor-workspace-read-only.sb');
  const candidateSkillTree = hashCursorEvaluationTreeV5(skillSource);
  const preparedRuns = definition.runs.map((runDefinition) =>
    prepareRun(
      runDefinition,
      directories,
      skillSource,
      gitExecutable,
      definition.promptSafetyProfile,
    ),
  );
  const manifest = {
    schemaVersion: 1,
    candidate: definition.candidate,
    preparedDate: definition.preparedDate,
    status: definition.status,
    predecessor: definition.predecessor,
    outputDir,
    client: { executable: cursorExecutable, version: clientVersion },
    skill: {
      source: skillSource,
      treeSha256: candidateSkillTree.sha256,
      fileCount: candidateSkillTree.fileCount,
    },
    runner: {
      path: runnerPath,
      sha256: sha256(fs.readFileSync(runnerPath)),
      argumentsBeforePrompt: ['--print', '--output-format', 'stream-json', '--mode', 'plan', '--sandbox', 'enabled', '--trust', '--workspace', '<workspace>'],
    },
    seatbeltProfile: {
      path: seatbeltPath,
      sha256: sha256(fs.readFileSync(seatbeltPath)),
    },
    evaluatorContract: {
      deterministicTests: 'node --test executed once locally per workspace; Cursor test calls expected 0',
      quickFixCollector: 'executed once locally per workspace; normalized output embedded in literal Prompt; Cursor collector calls expected 0',
      deepInventory: 'main...HEAD branch, HEAD, status, changed files, diff stat, and diff check frozen locally; Cursor Git calls expected 0',
      cursorAllowedTools: 'workspace-local read-only file tools only',
      cursorShellCallsExpected: 0,
      cursorMcpCallsExpected: 0,
      privateSourceAllowed: false,
      ...(definition.promptSafetyProfile === undefined
        ? {}
        : { promptSafetyProfile: definition.promptSafetyProfile }),
    },
    preparedRuns,
    repeatAssertions: definition.repeatCaseIds.map((caseId) =>
      repeatAssertion(preparedRuns, caseId),
    ),
    sourcePolicy: {
      externalModelRequests: 0,
      sourceBearingAuthorized: false,
      sourceFreeProbePassed: definition.sourceFreeProbePassed,
      sourceTransmitted: false,
      visibility: 'public-synthetic-only',
    },
  };
  const manifestPath = path.join(outputDir, 'control', 'freeze-manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  return { ...manifest, manifestPath, manifestSha256: sha256(fs.readFileSync(manifestPath)) };
}

export function copyDistributableSkill(source, target) {
  const resolvedSource = fs.realpathSync(path.resolve(source));
  if (
    !fs.statSync(resolvedSource).isDirectory() ||
    !fs.existsSync(path.join(resolvedSource, 'SKILL.md'))
  ) {
    throw new Error(`Skill source must contain SKILL.md: ${resolvedSource}`);
  }
  fs.cpSync(resolvedSource, target, {
    filter: (entry) => path.basename(entry) !== '.plugin-eval',
    recursive: true,
  });
}

export function prepareCandidate13(
  requestedOutput,
  requestedCursorExecutable,
  requestedGitExecutable,
  requestedSkillSource,
) {
  return prepareGroupedLedgerCandidate(
    requestedOutput,
    requestedCursorExecutable,
    requestedGitExecutable,
    requestedSkillSource,
    candidate13Definition,
  );
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    process.stdout.write(
      `${JSON.stringify(
        prepareCandidate13(
          options['--output'],
          options['--cursor-executable'],
          options['--git-executable'],
          options['--skill-source'],
        ),
        null,
        2,
      )}\n`,
    );
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();

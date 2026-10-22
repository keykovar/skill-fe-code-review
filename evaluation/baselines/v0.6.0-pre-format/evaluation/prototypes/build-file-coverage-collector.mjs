import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const collectorPath = 'skills/fe-code-review/scripts/collect-review-context.mjs';
const helperPath = 'evaluation/prototypes/file-coverage.mjs';
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error('Collector source anchor must occur exactly once.');
  return source.replace(before, after);
}

const legacyArguments = `function parseArguments(argv) {
  if (argv.length === 0) {
    return process.cwd();
  }

  if (argv.length !== 2 || argv[0] !== '--workspace' || !argv[1]) {
    throw new Error(usage());
  }

  return argv[1];
}`;

const candidateArguments = `function parseArguments(argv) {
  let workspace = process.cwd();
  let inventoryOnly = false;
  let workspaceSeen = false;
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === '--inventory-only' && !inventoryOnly) {
      inventoryOnly = true;
    } else if (argv[index] === '--workspace' && !workspaceSeen && argv[index + 1]) {
      workspaceSeen = true;
      workspace = argv[++index];
    } else {
      throw new Error(usage());
    }
  }
  return { workspace, inventoryOnly };
}`;

const inventoryFunction = `function collectInventory(requestedWorkspace) {
  const workspace = fs.realpathSync(path.resolve(requestedWorkspace));
  const rootBytes = runGit(workspace, ['rev-parse', '--show-toplevel'], false, true).stdout;
  if (rootBytes.at(-1) !== 10) throw new Error('Invalid repository-root record.');
  const repositoryRoot = fs.realpathSync(new TextDecoder('utf-8', { fatal: true }).decode(rootBytes.subarray(0, -1)));
  const head = runGit(repositoryRoot, ['rev-parse', 'HEAD']).stdout;
  const rawStatus = runGit(repositoryRoot, [
    '--no-optional-locks', '-c', 'core.fsmonitor=false', 'status', '--porcelain=v1', '-z',
    '--untracked-files=all', '--ignore-submodules=none', '--renames',
  ], false, true).stdout;
  const scopeKey = 'all-uncommitted:' + createHash('sha256')
    .update(repositoryRoot).update('\\0').update(head).update('\\0').update(rawStatus).digest('hex');
  const inventory = parseGitStatusInventory(rawStatus, { scopeKey, baseline: head, enumerationComplete: true });
  return {
    kind: 'file-inventory', scope: 'all-uncommitted', repositoryRoot, head,
    codegraphPresent: fs.existsSync(path.join(repositoryRoot, '.codegraph')),
    patchesIncluded: false, inventory,
  };
}`;

export function makeInventoryCollector(source) {
  let candidate = replaceOnce(source, "import path from 'node:path';", [
    "import path from 'node:path';",
    "import { createHash } from 'node:crypto';",
    "import { parseGitStatusInventory } from './file-coverage.mjs';",
  ].join('\n'));
  candidate = replaceOnce(candidate, '[--workspace <directory>]', '[--workspace <directory>] [--inventory-only]');
  candidate = replaceOnce(candidate, legacyArguments, candidateArguments);
  candidate = replaceOnce(candidate, 'args, allowFailure = false)', 'args, allowFailure = false, raw = false)');
  candidate = replaceOnce(candidate, "encoding: 'utf8',", "encoding: raw ? null : 'utf8',");
  // Preserve the raw status bytes until the strict UTF-8/NUL parser receives them.
  candidate = candidate.replaceAll('result.stderr.trim()', 'result.stderr.toString().trim()');
  candidate = replaceOnce(candidate, 'stdout: result.stdout.trimEnd(),', 'stdout: raw ? result.stdout : result.stdout.trimEnd(),');
  candidate = replaceOnce(candidate, '\ntry {\n', '\n' + inventoryFunction + '\n\ntry {\n');
  candidate = replaceOnce(candidate, '  const workspace = parseArguments(process.argv.slice(2));', [
    '  const options = parseArguments(process.argv.slice(2));',
    '  const result = options.inventoryOnly ? collectInventory(options.workspace) : collectContext(options.workspace);',
    '  if (options.inventoryOnly && !result.inventory.complete) process.exitCode = 2;',
  ].join('\n'));
  candidate = replaceOnce(candidate, 'JSON.stringify(collectContext(workspace), null, 2)', 'JSON.stringify(result, null, 2)');
  return candidate;
}

export function buildFileCoverageCollector(requestedOutput) {
  const requested = path.resolve(requestedOutput);
  const output = path.join(fs.realpathSync(path.dirname(requested)), path.basename(requested));
  const relative = path.relative(fs.realpathSync(path.join(repository, 'skills')), output);
  if (relative === '' || (relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative))) {
    throw new Error('Candidate output must be outside the formal Skill tree.');
  }
  const collector = fs.readFileSync(path.join(repository, collectorPath));
  const helper = fs.readFileSync(path.join(repository, helperPath));
  const files = new Map([
    ['collect-review-context.mjs', Buffer.from(makeInventoryCollector(collector.toString('utf8')))],
    ['file-coverage.mjs', helper],
  ]);
  const manifest = {
    kind: 'offline-file-coverage-collector-candidate',
    sources: [
      { path: collectorPath, sha256: sha256(collector) },
      { path: helperPath, sha256: sha256(helper) },
    ],
    files: [...files].map(([name, bytes]) => ({ path: name, bytes: bytes.length, sha256: sha256(bytes) })),
  };
  // Reject an existing destination rather than overwriting any previous evidence.
  fs.mkdirSync(output, { mode: 0o700 });
  for (const [name, bytes] of files) fs.writeFileSync(path.join(output, name), bytes, { flag: 'wx' });
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  return { output, manifest };
}

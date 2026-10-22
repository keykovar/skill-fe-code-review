# Inventory-only Collector Candidate

2026-10-09: the isolated collector candidate passes its local gate. Stable
remains v0.6.0. The installed Skill, formal collector, public output validators,
adapters and dependencies are unchanged. No model review was executed.

## Candidate Contract

The [builder](../../evaluation/prototypes/build-file-coverage-collector.mjs)
transforms an isolated copy of the existing collector and copies the unchanged
[inventory/accounting prototype](../../evaluation/prototypes/file-coverage.mjs)
beside it. Runtime imports stay inside that generated directory. No fixture,
expected output or semantic answer is included. The helper's accounting export
is not invoked by the collector. This is a tool candidate, not a promoted Skill
package or a second maintained public collector.

The builder rejects existing destinations and the formal Skill tree, checks
its transformation anchors, and writes a manifest with source/output hashes.
Its API accepts a new destination whose parent already exists:

```js
import { buildFileCoverageCollector } from './evaluation/prototypes/build-file-coverage-collector.mjs';
buildFileCoverageCollector('/new/candidate-directory');
```

The retained final local candidate supports:

```bash
node ".local-evaluation/file-coverage-collector-01/candidate-final/collect-review-context.mjs" \
  --inventory-only --workspace "/path/to/repository"
```

`--workspace` locates a repository, including from a subdirectory. It does not
restrict review to that path. Like the original collector, this option covers
all uncommitted changes only; do not use it for staged-only, commit, branch,
PR, range, or path-scoped review. Those scopes still need their own bounded
inventory commands or supplied manifests.

| Invocation/result | Behavior |
| --- | --- |
| No new flag | Existing fields and output preserved; explicit/implicit workspace results match the original byte for byte |
| `--inventory-only` | Repository root, HEAD, CodeGraph presence, declared all-uncommitted scope, and structured path/layer inventory; no patches, diff-check claim or reviewer-assigned states |
| Exit 0 | The emitted inventory was completely enumerated and parsed by the producer |
| Exit 2 | Structured incomplete inventory, known paths and explicit reasons; callers must not claim full coverage |
| Exit 1 | Invalid arguments, unavailable baseline, Git/spawn/encoding boundary failure; no success JSON |

The new branch performs three Git calls: root, HEAD, and one porcelain v1 NUL
status query. It explicitly includes untracked and submodule changes and enables
rename detection. Optional index locking and the configured fsmonitor hook are
disabled for that status call. The original default branch remains unchanged.

Raw status bytes reach the strict decoder before any text conversion. Repository
root decoding removes only Git's terminating LF, retaining trailing whitespace
belonging to the actual directory name. This latter correction is new-branch-only;
it does not silently change the legacy collector's path handling.

## Local Validation

| Suite | Passed |
| --- | --- |
| New isolated collector cases | 18/18 |
| Inventory/accounting prototype | 36/36 |
| Original collector compatibility | 3/3 |
| Existing output profile | 98/98 |
| Total | 155/155 across four files; zero failures or skips in the final run |

[Collector tests](../../tests/file-coverage-collector.test.ts) exercise exact
default-output parity, generated-file hashes, no-overwrite/formal-tree guards,
staged rename plus unstaged edit, unusual names, ignored user display settings,
explicit Git command scope, index preservation, malformed/truncated status,
invalid UTF-8, conflicts, argument errors, missing repository/HEAD and large
patch output. A real configured synthetic fsmonitor hook runs in the positive
control but is not invoked by the inventory-only command.

The overflow control lowers the buffer to 256 bytes in a test-only copy and
confirms the actual status subprocess reaches ENOBUFS with no success JSON.
The final retained candidate keeps the original 50 MiB limit; no new public
buffer option or relaxed limit was introduced.

The initial runs passed 152/152 and then 154/154. A focused new regression test
then reproduced ENOENT for a repository directory ending in whitespace because
the copied legacy root lookup used trimEnd. That failed result remains saved.
The bounded raw-root decoding correction and unchanged regression assertion
pass in the final 155-test run. No model retry or discarded failure is involved.

```bash
pnpm exec vitest run \
  "tests/file-coverage-collector.test.ts" \
  "tests/file-coverage-prototype.test.ts" \
  "tests/review-context.test.ts" \
  "tests/review-output-profile.test.ts"
```

## Output Size

One retained public synthetic repository changes 200 lines in each of 24 files.
Original and candidate default output are identical. The inventory-only result
contains exactly those 24 paths, with complete enumeration and unchanged source
and index bytes:

| Output | UTF-8 bytes |
| --- | --- |
| Full default context | 385,643 |
| Inventory only | 3,575 |
| Difference | 382,068 fewer bytes, 99.07% for this sample |

This measures the initial collector response only. Required patches still need
to be read later, and small changes may not benefit. It does not establish a
token, total-review-cost, latency or accuracy improvement.

The final candidate, preliminary artifacts, first failure, final test report,
size comparison and validation receipt are retained under
`.local-evaluation/file-coverage-collector-01/`. Final selected artifacts use
`candidate-final`, `vitest-final.json` and `output-size-final.json`; the earlier
candidate and measurements remain unchanged.

## Limits And Next Gate

Producer completeness does not prove complete client delivery, semantic review,
an atomic worktree snapshot, or OS/network isolation. The scope key hashes the
root, HEAD and status records; it does not hash file contents and cannot detect
all concurrent edits. Independent material/integrity evidence remains required
for evaluation. Native cases were run on the current macOS environment; broader
platform/client acceptance is not implied.

Next integrate this option into isolated Quick/Deep candidate instructions and
candidate report validation, including complete/incomplete output, bilingual
scope summaries, unchanged recommendation rules and a focused Fix control.
Preserve the formal Skill and default/v0.6.0 profiles until acceptance. Do not
start external model evaluation solely because these local tooling gates pass.

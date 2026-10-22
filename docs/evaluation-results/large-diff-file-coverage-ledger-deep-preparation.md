# Composed File Coverage Deep Preparation

Preparation snapshot, 2026-10-15: **Offline Pass; Candidate and Stable Not Run.** A fresh Deep pair
uses the [composed file-coverage candidate](large-diff-file-coverage-ledger-composition.md)
and the unchanged public FC-D-001 packet. This is preparation only; no external
task, provider request, source transmission or model invocation has occurred.

Subsequent execution: [Candidate passes its single pilot; Stable is No-Go for
format, and the pair is No-Go for promotion](large-diff-file-coverage-ledger-deep-runtime.md).
The preparation snapshot and frozen control files below retain their original
state; runtime authorization and results are separate.

## Frozen Inputs

The [new preparation builder](../../evaluation/prototypes/prepare-file-coverage-ledger-deep.mjs)
retains the original candidate-then-stable order. Only the candidate instructions
change relative to the earlier file-coverage pair. It verifies that core and
Deep are exactly the existing format transformation of their frozen parent,
and that all other selected instructions are unchanged. Stable retains formal
v0.6.0 bytes. All five packet files are identical across the two runs and to the
original frozen packet; the missing target session is still not supplied.

Each workspace has eleven files: nine evidence files, `materials.json`, and
`bootstrap.md`. Bootstrap is delivered once through the startup and is not read
again. The nine evidence files are core, Deep, JavaScript and release-risk
instructions, packet metadata/context, and three source snapshots. No oracle,
plan, history, answer or report is included in either reviewer workspace.

The selected original Deep oracle is stored outside the reviewer workspaces.
Finding, file-accounting, evidence, recommendation and read-only gates are
unchanged. The original 900,000 ms Deep elapsed ceiling and comparison cost
budgets remain frozen. Elapsed time is checked after completion; automatic
deadline cancellation is not implemented or claimed. Quick/Fix are outside
this window. Candidate must pass before Stable is considered.

## Delivery Contract

The builder reuses `pairedReadRanges` and `verifyBoundedReadDelivery`. Each arm
has eighteen material reads: the manifest first, then complete contiguous line
ranges capped at 6,000 UTF-8 bytes. A separate startup read makes nineteen
calls. Full per-call templates retain both the outer `functions.exec` budget
and shell budget at 20,000 tokens, the exact workspace, read order and command.

Each arm has a frozen dispatch prompt and launch file. Dispatch includes the
complete startup-read call; launch includes all eighteen material-read calls.
This prevents an omitted launch file or an implicit output-budget assumption
from passing offline preparation. A supplied packet's declared evidence gap is
distinguished from transport failure. Failed/truncated/outside reads stop the
run without retry or fallback. Prompt templates do not enforce client behavior
or filesystem isolation; actual tool inputs, output bytes and the whole trace
still require assessment.

| Local measurement | Candidate | Stable |
| --- | ---: | ---: |
| Workspace files | 11 | 11 |
| Evidence files reconstructed | 9 | 9 |
| Material reads | 18 | 18 |
| Total calls including startup | 19 | 19 |
| Largest material read, bytes | 5,972 | 5,996 |
| Original evidence bytes | 60,418 | 52,833 |
| Startup bytes | 9,258 | 9,199 |
| Dispatch bytes | 707 | 704 |
| Total delivered content bytes | 73,314 | 65,665 |

Totals count material returns, startup and dispatch once each. Bootstrap is
already included in startup; control metadata not sent to the reviewer is
excluded. Tool/client overhead is unknown. Candidate instructions add bytes,
and equal call counts do not establish equal tokens, latency, money or quality.

## Offline Checks

All **153 tests across seven related suites pass**, including twenty-two new
preparation checks. Fixtures generate their own parents instead of depending
on retained local history. They cover exact selected instructions/source/oracle,
unchanged gates, call budgets and startup files, contiguous reconstruction,
missing/extra/reordered/truncated/failed receipts, changed tools/workdirs,
source/control drift, symlinks, digests and protected destinations. Negative
receipt cases can run independently of the native-replay tests.

Native read-only replay of the actual frozen directory passes all **38/38**
calls and reconstructs **18/18** evidence files across both arms. The input and
output snapshots are reverified afterward. Candidate bundle and formal Skill
pins match, the installed symlink still resolves to the formal tree, and the
earlier Window 03b freeze plus raw No-Go report hash remain unchanged. No reviewed
source or model is executed. These checks establish local delivery preparation,
not model-visible delivery, semantic acceptance or a passing comparison.

Local receipts and test results are retained in
`.local-evaluation/file-coverage-ledger-deep-01/`. The dispatchable directory is:

```text
/private/tmp/fe-file-coverage-ledger-deep-01-1792049229593
```

Its independent freeze SHA-256 is:

```text
fc0bf883977664e4a674816aebc04af6f6d78cf52a2017afe53c5c68f734c9b7
```

Candidate bundle SHA-256 remains
`205664708b8c0d0ed19c667312d242ace7e071f914f5df2e0ad7b854ea87e510`.
Candidate dispatch uses `control/candidate-dispatch.md` and
`control/candidate-launch.md`; Stable uses separately frozen equivalents.
Read only the chosen dispatch prompt into the new task, not evaluator controls.

## Next Gate

Obtain explicit authorization for one independent Candidate Codex Desktop
`gpt-6-astra / xhigh` task. Before dispatch, recheck the actual configured
provider route, candidate and freeze hashes. Send only the frozen candidate
materials and startup metadata. Assess the unedited report, actual tool calls,
returned bytes, file accounting, evidence/semantic boundaries and elapsed time.
No automatic retry, follow-up report correction or Stable dispatch is allowed.

Formal/installed v0.6.0, historical failures and the strict parser are unchanged.
No installation, commit, push, tag or release is part of this preparation.

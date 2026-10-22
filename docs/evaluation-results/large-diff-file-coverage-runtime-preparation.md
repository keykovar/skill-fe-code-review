# File Coverage Runtime Comparison Preparation

Preparation snapshot, 2026-10-12: **six public-synthetic material packets were
frozen locally before any model run**. The 22 preparation tests and 50 report-profile tests
pass, 72/72 total. The previously accepted candidate and formal v0.6.0 Skill
remain unchanged.

Later that day, the authorized stable Quick run completed but was not accepted;
candidate Quick was withheld. See the [runtime result](large-diff-file-coverage-quick-runtime.md)
for the output/delivery failures and oracle conflict. The preparation and
pre-dispatch decisions below are retained historical records.

## Comparison Scope

This is a bounded behavior comparison for the file-coverage candidate, using
three cases with one stable and one candidate run each. Each pair has identical
source, baseline metadata and bootstrap bytes. Only the selected Skill
instructions differ. The paired order is frozen before execution:

| Order | Case / mode | Variant | Delivered files | UTF-8 bytes |
| --- | --- | --- | ---: | ---: |
| 01 | FC-Q-001 / Quick | Stable v0.6.0 | 17 | 54,424 |
| 02 | FC-Q-001 / Quick | Candidate | 17 | 61,445 |
| 03 | FC-D-001 / Deep | Candidate | 11 | 63,175 |
| 04 | FC-D-001 / Deep | Stable v0.6.0 | 11 | 56,146 |
| 05 | FC-F-001 / Fix | Stable v0.6.0 | 12 | 50,472 |
| 06 | FC-F-001 / Fix | Candidate | 12 | 56,954 |

Byte totals include the bootstrap, per-run material manifest, selected core/mode/
JavaScript instructions, Deep release-risk reference, and source packet. These
are material bytes, not measured input tokens or billed usage. Fix's shared-core
overhead is included even though its mode reference is unchanged.

The source packets explicitly declare synthetic baseline/index/target snapshots;
they are not live Git repositories. No Git objects, commits, user branches,
credentials, network calls or client logins are created. This gate does not test
the inventory collector, automatic discovery, client installation or repository
enumeration. It deliberately tests file/layer reasoning and report behavior
separately from those surfaces.

## Cases And Expected Evidence

- **FC-Q-001:** four changed logical paths: one URL helper changed in both staged
  and unstaged layers, one rename, one generated path, and one actual deletion.
  The helper's staged parameter rename preserves behavior; its unstaged direct
  concatenation breaks two supported slash combinations. Require one New/Risk
  finding, Not Run, Simplify and consistent `修改后提交`. Check the unchanged
  combinations and query preservation too. Candidate coverage must account for
  all four paths, including the producer/consumer evidence for generated content.
- **FC-D-001:** a complete two-path inventory with a genuinely undelivered target
  authentication owner. The caller's local change is available. Require an
  explicit critical evidence gap and `暂不建议进入下一步`, with the same necessary
  source/contract verification in both conclusion and ending. Do not fabricate
  a finding from the missing source. Candidate accounting is one Reviewed and
  one Cannot Verify; unavailable source is not an incomplete path enumeration.
- **FC-F-001:** verify the existing F-007 URL finding against original, problem
  and fixed snapshots plus its direct caller. Its declared acceptance permits
  static closure. Require Resolved/Risk, New relative to the original baseline,
  Not Run, counts 1/0/0/0/0, no new regression and `可以关闭`. Both variants must
  preserve the existing Fix scope without file or changed-condition ledgers.

Stable reports use the unchanged v0.6.0 validation contract. Absence of the new
file-summary grammar is not a stable-version failure. Both variants have the
same semantic quality gates; only candidate Quick/Deep require the new syntax.

The [fixture definitions](../../evaluation/prototypes/file-coverage/runtime-fixtures.mjs)
contain public synthetic source and scope contracts. The separate
[oracles](../../evaluation/prototypes/file-coverage/runtime-oracles.json) describe
required outcomes. They must remain evaluator-only. Expected file states are
not actual evidence: after execution, derive accounting from the unedited report
and trace. A read or an omitted detail alone cannot establish Reviewed.

## Frozen Gates

The [plan](../../evaluation/prototypes/file-coverage/runtime-plan.json) proposes
independent Codex Desktop sessions with `gpt-6-astra / xhigh`, using the current
user-configured provider. The actual route, model and settings must be checked
before any separately authorized execution. Do not print or deliver credentials.
The first execution decision concerns the Quick pair only; later pairs depend
on the preceding gate and are not automatically authorized by this preparation.

Quality requires every expected finding/closure/gap, zero unsupported findings,
correct severity and Origin/Reproduction, Chinese mode output, consistent final
recommendations, no invented runtime observations, and no scope/write/tool
violations. Material delivery and before/after hashes must reconcile. Any observed
quality regression prevents promotion; a small pass does not prove general
accuracy or that a real large diff was completely reviewed.

Cost gates are conservative pilot limits, not predictions:

- At most one attempt per run, six source-bearing runs total; no automatic retry,
  replacement, follow-up correction or selected best result.
- Quick/Fix each have a 600-second ceiling; Deep has 900 seconds. This is an
  evaluator stop bound, not permission to omit required evidence and claim a pass.
- For each comparable pair, candidate total reported input-plus-output tokens,
  elapsed time and tool calls must not exceed stable. Aggregate token/time ratios
  must also be at most 1.0. Include the selected core/mode instruction overhead.
- Duplicate source reads without an unresolved evidence question must be zero.
  File-summary output is one line plus actual gap details; Fix adds zero lines.
- Record provider token fields separately, preserving cache and reasoning
  accounting without double-counting. Missing/incomparable telemetry is Unknown
  and holds cost acceptance. Bytes are not substitute tokens; monetary savings
  cannot be claimed without comparable provider prices/cache billing.
- A failed gate holds later stages and promotion for offline investigation.
  Preserve the result; do not relax the budget after seeing it.

Packet reviews cannot demonstrate the inventory collector's smaller initial
response. With the extra core rules, this comparison may fail the cost ceiling
even if coverage quality passes. Record that outcome as such. A later live-Git
comparison, if justified and authorized, would be a separate measurement, not
an excuse to relabel this one. Single paired latency observations are sensitive
to provider load; passing is only a pilot result, and failure is not proof of a
universal slowdown. High-volume, truncated-inventory, binary and untracked-file
runtime cases remain outside this bounded window.

## Preparation And Validation

[The preparation helper](../../evaluation/prototypes/prepare-file-coverage-comparison.mjs)
verifies the accepted candidate manifest, all formal source/recipe pins and the
candidate files before reserving a new output directory. It copies only the
necessary Skill references, not unrelated modes, the collector or evaluator
modules. It rejects existing output, formal/frozen Skill destinations and
changed candidate inputs. Source/control manifests are separate from reviewer
workspaces. An independently retained freeze digest is required for subsequent
checks, which reject source drift, extra files, altered controls or symlinked
materials.

The 22 tests include exact paired bytes, snapshot-to-inventory reconciliation,
both layers on one path, rename/deletion identity, genuinely missing Deep source,
oracle exclusion, isolated output bounds and negative integrity controls. Tests
execute only the newly authored pure URL/name/generator functions locally. All
four supported URL combinations match before/index/fixed behavior; the problem
snapshot mismatches the expected URL in the two no-slash/double-slash cases.
These maintainer observations are not sent to the reviewing model, so it must
not present them as its own reproduction evidence. Both test runs pass without
changing assertions or increasing timeouts: 22/22 initial, then 72/72 including
the existing 50 report-profile controls.

Local, ignored artifacts are under
`.local-evaluation/file-coverage-comparison-01/`: `vitest-initial.json`,
`vitest-final.json`, `preparation-receipt.json`, `result.json` and `materials/`.
The material root holds evaluator-only `control/` and six separate `workspaces/`.
The pinned freeze digest is
`5571c59430c2854f73d7c15be5676fdc5717f4706926db2f14d6aeacb4b7853d`.
Separated folders and prompts are not OS isolation. Any eventual run needs a
bounded read surface and independent trace audit; do not let it browse the
parent repository or control directory.

## Preparation Decision (Historical)

Offline preparation passes. All six runtime statuses are **Not Run**; execution
is not authorized by these artifacts. No installed Skill or public validator
changes, dependency installation, model request, Git delivery or release occurs.
Stable v0.6.0, Claude Not Verified, `runtimeReady=false` and deferred SSE remain.
Next decide whether to execute the first Quick pair with these exact inputs.

## Quick Dispatch Preflight (Historical)

2026-10-12: all six packet hashes and frozen inputs still match. Current local
configuration records `custom` / Joymeet, `https://t.kxmeet.com`, Responses and
`gpt-6-astra / xhigh`. Only selected configuration fields were printed; no
authentication file was read or credential recorded. Configuration is evidence
of the intended route, not independent verification of remote routing, retention
or billing.

Two concrete launch requests are prepared under the local
`stage-1-dispatch/` directory. Each binds the unchanged bootstrap to its exact
material root, without including an oracle or earlier report. Stable startup is
1,772 UTF-8 bytes and candidate startup is 1,775 bytes, the three-byte difference
coming from their root directory names. These actual startup bytes must be
included in later usage accounting, not replaced with the earlier standalone
bootstrap size. Source packets and bootstrap content remain identical within
the pair.

Task creation and source-bearing execution remain pending explicit user
authorization for this pair. The Codex `create_thread` tool requires explicit
authorization to create a separate task. No new task or model call has occurred.
If authorized, run stable first and assess its complete raw report/trace before
dispatching candidate; existing quality, integrity, time and no-retry gates apply.

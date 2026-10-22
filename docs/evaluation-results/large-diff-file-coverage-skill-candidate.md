# Large-diff File Coverage Skill Candidate

2026-10-09: **isolated Quick/Deep instructions and evaluator-only report checks
pass the local gate**. There are 226 passing tests across seven related suites,
plus two passing Skill shape validators. No model invocation, client login,
installed-Skill update, public-validator change or release is implied.

## Candidate Boundary

[The builder](../../evaluation/prototypes/build-file-coverage-skill.mjs) reads the
current stable Skill and creates a new destination containing `fe-code-review/`
and a SHA-256 manifest. It refuses existing destinations and the formal Skill
tree, including a symlink alias of that tree. Hidden local evaluator data such
as `.plugin-eval` is excluded from the candidate package.

The 12-file stable package becomes a 13-file isolated candidate. Only four
existing files change: core `SKILL.md`, the Quick and Deep references, and the
collector. One colocated inventory helper is added. The Fix reference, agent
metadata/automatic invocation and all six technology/risk references retain
their bytes. Outside the explicit collector-routing replacement, the original
core rules remain verbatim, with the mandatory file rules inserted into core.
No rule depends on a newly optional reference.

Quick/Deep all-uncommitted reviews use the previously tested `--inventory-only`
collector, followed by bounded reads of the required patch layers. The core
explains that this output has no patches or diff-check result. Narrower reviews
use their selected comparison; the collector's `--workspace` is not a path
filter. Fix keeps the original default collector route when applicable and its
focused scope, template, statuses and prohibition on a Coverage ledger.

## Report Contract

The candidate uses one summary inside Quick `审查范围` / `Review Scope` or Deep
`变更理解` / `Change Understanding`. Complete files do not need individual output.
Every incomplete file needs a detail line; an incomplete inventory also needs
one inventory-gap explanation. No new top-level report section is introduced.

```md
- 文件覆盖：清单 Complete；4 个变更路径；Reviewed 1 / Partial 1 / Deferred 1 / Cannot Verify 1。
- 文件缺口：Partial；路径 "src/url.ts"；原因 已检查 staged，unstaged 回退尚未检查。
- 文件缺口：Deferred；路径 "src/generated.ts"；原因 生成来源和兼容性影响尚未检查。
- 文件缺口：Cannot Verify；路径 "assets/status.png"；原因 缺少必要的二进制视觉对比。
```

For an incomplete inventory the count becomes `至少 4 个已知变更路径`, with a
`清单缺口` line. The English equivalent and all state rules are defined once in
[the candidate core fragment](../../evaluation/prototypes/file-coverage/skill-rules.md).
Gap paths use JSON string quoting to preserve spaces, quotes and control
characters without splitting one logical path across report lines. This is not
a required JSON report or a request to write a ledger file.

[The candidate report validator](../../evaluation/prototypes/validate-file-coverage-report.mjs)
is a separate evaluator API:

```js
validateFileCoverageReport(markdown, mode, {
  language: 'zh-CN',
  sourceRoot: '/review',
  inventory,   // Independently frozen selected-scope inventory.
  accounting,  // Evaluator-side path/state/layer/evidence assessment.
});
```

`inventory` and `accounting` reuse the first prototype's data structures; the
reviewing model does not supply mandatory JSON. The evaluator must assess the
map independently, rather than derive all Reviewed states from report omission.
For Fix, omit both inputs. The wrapper retains the complete `base` v0.6.0 result,
adds `accounting` and `coverage` results and leaves `semanticStatus` and
`reportAcceptance` as `Not Evaluated`, including on a structural pass.

This compact-output profile checks summary totals against the independent
inventory/map, all incomplete-path membership/states, duplicates, missing and
placeholder reasons, lower-bound grammar, localized labels and scope placement.
It preserves the existing Origin/Reproduction, Finding ID, changed-condition,
empty-section and Fix checks. It does not verify the truth of prose, the semantic
adequacy of reasons, the requested-scope description or recommendation meaning.
A test deliberately passes an unsupported but structurally complete evidence
assertion to preserve that limitation explicitly. Nonblocking authored controls
cover no-finding and Improve-only reports without turning file coverage into a
mandatory runtime-test gate.

## Checks And Retained Failures

| Suite | Passed |
| --- | ---: |
| Isolated Skill builder / byte preservation | 6 |
| Candidate report profile and controls | 50 |
| Inventory/accounting prototype | 36 |
| Inventory-only collector candidate | 18 |
| Original collector | 3 |
| Public v0.6.0/default profile | 98 |
| Original output-validator behavior | 15 |
| Total | 226 |

The first run passed 54/56 new tests and retained two failures. One exposed a
real packaging boundary defect: recursive copying included the local
`.plugin-eval/benchmark.json`. The builder now excludes hidden local data. The
other was a test setup omission: the negative inventory test used an existing
linked-Coverage report without its required source root. That input now supplies
the root; the public validator was not weakened.

The corrected six-suite run passes 223/223. Its command also named a nonexistent
legacy-collector test filter, so that suite was explicitly run under its correct
name afterward and passes 3/3. The 226 total is the union of those seven suites,
not a full repository-suite or a model score. No historical acceptance window
was rerun to select a passing result.

Default `python3` could not import PyYAML. Both shape validators subsequently
pass using the existing Python 3.11.15 / PyYAML 6.0.3 environment. No dependency
was installed and no global environment was changed.

Local records under `.local-evaluation/file-coverage-skill-01/` are excluded from
the public repository: `vitest-initial.json`, `vitest-local.json`,
`vitest-legacy-collector.json`, `shape-validation.json`, `candidate/manifest.json`
and `result.json`. Initial failures remain separate from the corrected results.

## Decision And Next Step

This gate establishes reproducible candidate construction and deterministic
report/accounting checks only. It does not establish actual review completeness,
finding precision/recall, correct severity/recommendations, client behavior,
provider isolation, token savings or lower total review latency. The added core
rules have an input cost; the earlier collector's smaller first response is not
evidence of an end-to-end saving.

Measured UTF-8 instruction growth is 6,482 bytes in core, 539 in Quick and 547
in Deep. With exactly one selected mode reference, this adds 7,021 instruction
bytes for Quick or 7,029 for Deep. Fix still loads the shared core, so its input
also grows by 6,482 bytes even though its mode file and output remain unchanged.
These are byte counts, not token estimates. The runtime comparison must include
that Fix overhead; unchanged Fix behavior alone would not establish acceptable
cost. No efficiency claim or candidate promotion is made by this local gate.

Next prepare a bounded, public-synthetic runtime comparison offline: a mixed
file/layer Quick case, a Deep case with a critical unavailable file, and an
unchanged Fix scope control. Freeze inputs, expected findings/gaps, manual
acceptance gates and the cost budget before selecting concrete external runs.
Do not send evaluator accounting/oracles to the reviewer. Model calls and any
later promotion remain separate decisions. Stable v0.6.0, the installed Skill,
default/v0.6.0 validators, Claude Not Verified, `runtimeReady=false` and deferred
SSE remain unchanged.

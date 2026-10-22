# Format-Only Adoption Plan

2026-10-22: **The reviewed patch is applied locally and verified.**
All twelve installed Skill files match the accepted candidate. The main
checkout now uses the expanded seventeen-suite historical baseline; the full
suite passes 1,699/1,699. See the [application result](evaluation-results/ledger-format-formal-application.md).
Publication remains v0.6.0; this application made no Git delivery or release.

## Product Change

| Skill file | Exact change | Byte delta |
| --- | --- | ---: |
| `SKILL.md` | State that Quick/Deep Coverage contains only ledger items and blank lines; move explanations to Evidence and explicitly exclude Fix. | +325 |
| `references/quick-review.md` | Move explanatory instructions outside the output template and use one literal Disposition value. | +231 |
| `references/deep-review.md` | Apply the same template correction to Deep. | +231 |

Only these three of twelve packaged files change. Fix reference, framework
references, metadata and collector stay byte-identical. Quick/Deep selected
instructions add 556 bytes per review; Fix still loads the core, so it also
receives the 325-byte explicit Quick/Deep boundary. These are byte differences,
not token, time or cost improvements.

The patch preserves the approved candidate bytes exactly. Do not combine it
with File Coverage, reference deduplication, rule compression, implicit-trigger
changes, probability estimates, a new review mode or parser relaxation. Finding
severity, Origin/Reproduction, independent-root-cause grouping, read-only
rules, bilingual headings and recommendation consistency remain in place.

Candidate manifest:
`61460297bc2bb429e046ae8bcfe0dc5b762a8171d80a4e5c3dcaa31a2c6e4298`.
The proposed patch is retained at
`.local-evaluation/ledger-format-adoption-plan-01/format-only.patch`.
It was applied to `skills/fe-code-review` on 2026-10-22 as part of the reviewed
combined patch.

## Retained Acceptance

The three original reports, evidence manifests, completion text and selected
candidate bytes have been rechecked locally. The prior manual judgments are
reused as recorded evidence, not counted as new reviews.

| Case | Exercised behavior | Retained checks | Limit |
| --- | --- | --- | --- |
| [FC-Q-001 Quick](evaluation-results/ledger-format-quick-runtime.md) | Two independent findings, twelve Coverage entries and repeated ID. | 10/10 manual checks. | One Chinese synthetic case. |
| [FC-D-001 Deep](evaluation-results/ledger-format-deep-read-call-runtime.md) | Zero findings, nine Coverage entries and explicit missing-target Cannot Verify. | 8/8 manual checks. | Historical client; not a repeated-ID case. |
| [LF-D-002 Deep](evaluation-results/ledger-format-deep-findings-runtime.md) | Two Risk/New/Not Run findings, five Coverage entries, justified repeated F-001. | 8/8 manual checks. | No matched cost control or general accuracy estimate. |

All three pass the unchanged public v0.6.0 output profile. Reconstructed packet
Skill files match this candidate. Do not repeat these cases just to accumulate
passes. Fix reference parity and local controls do not imply a new Fix runtime
pass. English output, Cursor/Claude, automatic discovery and installed workflow
remain outside these three runtime acceptances. Logical packet links also do
not prove clickable source-file availability.

## Rehearsal Results

The original scoped rehearsal used a separate workspace with the accepted
candidate and selected tests. It made no test changes to the main checkout;
the later baseline migration and combined rehearsal are recorded below.

| Check | Result |
| --- | --- |
| `git apply --check` for exact three-file patch | Pass; no application or index write. |
| Initial scoped rehearsal | 140/141 passed; one obsolete template-string assertion failed. |
| Rehearsal after proposed test adjustment | 141/141 passed across four suites. |
| Skill structure and content | 3 + 25 checks, including read-only boundaries, all modes, headings and recommendation rules. |
| Public output profile and examples | 98 + 15 checks, including existing invalid-output controls and Fix examples. |
| Repository and official Skill shape validators | Both Pass, using the existing isolated Python environment. |
| Old builder on preserved v0.6.0 baseline | Pass; rebuilt manifest equals the accepted candidate manifest. |
| Old builder on the applied rehearsal copy | Expected incompatibility: `Ledger format anchor must occur exactly once.` |

The failing content test expected the old combined text
`Behavior Preserving：行为保持` and `Cannot Verify：无法验证` inside each reference.
That placeholder line is deliberately replaced by the fixed Disposition
vocabulary. The proposed test adjustment checks the documented literal states
`Behavior Preserving` and `Cannot Verify`; bilingual heading assertions,
read-only checks, grouping rules and parser negative controls remain unchanged.
The two-line test patch is `test-contract-update.patch` beside the Skill patch.
The initial failure and passing follow-up are both retained.

These original rehearsal checks were narrow application checks, not a full repository regression pass.
No new model task, provider request, source execution by a reviewer, dependency
installation or formal Skill write occurred.

### Combined Rehearsal Completed

The [full combination result](evaluation-results/ledger-format-combined-rehearsal.md)
preserves the initial failure and its dependency diagnosis. Five additional
historical suites need fixed inputs, and one published-evidence assertion must
use the saved v0.6.0 Skill. A new 87-file baseline revision preserves the first
65-file baseline and routes seventeen unchanged suites. The strict recipes,
original hashes and validators remain unchanged.

The corrected isolated workspace passes 1,699/1,699 checks across 81 files,
including 361 historical checks, with no skipped or duplicate suites. Both
shape validators pass and all twelve Skill files match the accepted candidate.
The pending patch changes seven existing files and adds 89 archive files;
only three files affect the installed Skill. Forward and reverse application
checks pass. This patch is retained at
`.local-evaluation/format-adoption-combined-01/pending-application.patch`.
These additional application changes were applied to the main tree on
2026-10-22 and passed the complete verification recorded above.

## Historical Baseline Dependency

The existing prototype builder derives its inputs from the current
`skills/fe-code-review` tree and applies the old template transform. Several
material verifiers also compare original candidate source hashes against that
live tree. After adoption, that tree will correctly contain the new bytes, so
re-running those historical recipes against it is invalid.

The isolated test confirms this is a real tooling dependency, not a model
regression. The original builder is itself frozen in accepted receipts. Do not
edit it in place, make the transform silently skip anchors, weaken hash checks,
rewrite old manifests or skip historical tests to obtain a green suite.

The initial dependency inventory contained these twelve test files; the
combined-rehearsal report records the five additional consumers:

| Direct format-builder consumers | Composed File Coverage consumers |
| --- | --- |
| `ledger-format-candidate.test.ts` | `file-coverage-ledger-skill.test.ts` |
| `ledger-format-quick-preparation.test.ts` | `file-coverage-ledger-dedup.test.ts` |
| `ledger-format-deep-preparation.test.ts` | `file-coverage-ledger-deep-preparation.test.ts` |
| `ledger-format-deep-isolated-preparation.test.ts` | `file-coverage-deep-dispatch.test.ts` |
| `ledger-format-deep-read-template.test.ts` | `file-coverage-stable-dispatch.test.ts` |
| `ledger-format-deep-findings.test.ts` | |
| `ledger-format-deep-findings-dispatch.test.ts` | |

Use the repository's existing `evaluation/baselines/pre-v0.6.0` separation
pattern for a **distinct v0.6.0/pre-format baseline**; the older pre-v0.6.0
baseline must not be relabelled or overwritten. Preserve the exact twelve
v0.6.0 Skill files and the minimum frozen recipe/fixture dependencies needed
by these consumers. Their historical input hashes stay fixed. Test dispatch
must distinguish this explicit historical root from the current installed
Skill root; the current structure/content/output checks continue to exercise
the live tree. Keep the baseline machinery outside the installed Skill.

Before finalizing the migration, enumerate the dependency closure and verify
that each historical builder/material test still rejects changed inputs and
reproduces its original candidate manifest. Do not add a general compatibility
framework or copy unrelated local runtime sessions into the public baseline.
If a historical frozen recipe needs its original `tests/` bytes as pinned
input, retain those bytes as baseline data instead of rewriting its hash.

### Isolation Completed

The [baseline isolation result](evaluation-results/ledger-format-baseline-isolation.md)
records 65 exact original files under `evaluation/baselines/v0.6.0-pre-format`.
The twelve unchanged suites run in a separate Vitest fork project, while the
current project keeps live Skill/content/output checks. The older v0.6.0
promotion assertion now also checks the saved v0.6.0 bytes. No original recipe,
frozen suite, input, validator or accepted output hash was rewritten.

The historical project passes 269/269 tests. Seven routing checks cover exact
manifest reconstruction, changed sibling live Skill independence, rejected
baseline drift and one-project ownership. One full current-tree regression
passes 1,698/1,698 across 81 files, with zero skipped tests and exactly twelve
historical file results. This validates the routing migration with the formal
Skill unchanged; it is not the combined candidate-application rehearsal.

## Historical Availability

Of the 104 protection/preparation pins inherited from LF-D-002 preparation,
103 currently match and one file is absent at its original path:
`/private/tmp/fe-file-coverage-ledger-dedup-deep-01-20261016/control/freeze.json`.
Its expected hash is
`4503625ca3ad5771e6525ab5f74b061be668137ead8836123ab115f676b0889a`.

This belongs to a separate older File Coverage window. It was not recreated,
silently skipped as verified or used as fresh evidence. The associated retained
report remains unchanged. The selected format-only candidate and all three
accepted format-only report/material sets remain available and pass the
checks above. Therefore local proposal work can proceed, while a claim of
complete original-path historical revalidation would be false. All 123
available files pinned by this proposal pass their current checks.

## Application Sequence

1. **Complete:** preserve the historical baseline and route its twelve suites.
   The formal Skill remained unchanged during this stage; its full current-tree
   regression are recorded in the linked isolation result.
2. **Complete:** rehearse the three Skill changes, the two assertion updates
   and baseline migration together. Retain the first failure; the corrected
   expanded routing passes the full combined suite without new dependencies.
3. **Complete:** the reviewed application diff is linked above. The installed
   `/Users/keykovar/.agents/skills/fe-code-review` symlink resolves to the formal
   repository Skill, so application affects subsequent local use immediately
   at file-read time. A task that already loaded the Skill may retain old text;
   prefer a new task for normal usage after application.
4. **Complete:** apply the authorized scope and verify all twelve installed
   files against the accepted candidate. Full regression and both shape
   validators pass. The prior snapshot is retained; any later rollback must
   target only this change and preserve unrelated work.

No version bump, commit, push, tag, release or external client smoke test is
part of this proposal. A future patch release such as v0.6.1 may fit this narrow
format correction, but version selection and publication remain separate.
The separate File Coverage experiment and `runtimeReady=false` remain unchanged.

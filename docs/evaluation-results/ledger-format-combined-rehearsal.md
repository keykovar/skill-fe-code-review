# Format-Only Combined Application Rehearsal

2026-10-21: **Combined rehearsal Pass; the complete application patch is ready
for review. Formal/installed Skill application is pending.**

## Result

A fresh workspace copied 781 repository files, including the previous baseline
migration, and reused the existing Node dependencies without installation.
The exact three-file format patch and two-line template assertion patch were
applied only there. All twelve Skill files match the accepted candidate
manifest `61460297bc2bb429e046ae8bcfe0dc5b762a8171d80a4e5c3dcaa31a2c6e4298`.

The first full run exposed historical dependencies not covered by the initial
twelve-suite inventory. The failure is retained. After a bounded correction
to the rehearsal's test routing, the full run passes 1,699/1,699 in 81 files.
No original recipe, archived test, oracle, validator or candidate bytes changed.

| Check | Result |
| --- | --- |
| Initial combined full run | 1,614 passed, 10 assertion failures, four suites failed during initialization; their 74 tests were not collected. |
| Expanded historical project | 361/361 across seventeen files. |
| Current routing and repository evidence checks | 29/29 across two files. |
| Final combined full run | 1,699/1,699 across 81 files; zero skipped. |
| Suite ownership | Same 81 logical suite names as before; exactly seventeen run from the revised archive, with no duplicate original execution. |
| Repository and official Skill shape validators | Both Pass; subsequent routing edits leave their validated Skill bytes unchanged. |
| Exact candidate identity | 12/12 files match; only the existing three format files differ from formal v0.6.0. |
| Patch checks | Forward check on the main checkout and reverse check on the rehearsal both pass without applying either. |

The single added test verifies preservation of the first baseline. The increase
from 1,698 to 1,699 is not a new review capability or runtime acceptance.

## Historical Dependency Correction

The initial inventory followed builder entry points but missed one suite that
calls the format transform directly and three suites that build a parent
candidate checked against a frozen manifest. The older preview-package suite
also intentionally requires integration-12's original v0.6.0 Skill bytes.

| Additional archived suite | Why it needs frozen inputs |
| --- | --- |
| `bounded-review-materials.test.ts` | Compares original and format-only materials by applying the old transform. |
| `file-coverage-comparison.test.ts` | Requires the original File Coverage candidate manifest. |
| `file-coverage-deep-preparation.test.ts` | Builds a parent with that frozen candidate identity. |
| `file-coverage-quick-replacement.test.ts` | Preserves the same original comparison and replacement evidence contract. |
| `review-profile-package.test.ts` | Rebuilds the historical integration-12 preview package, not a future live-Skill package. |

The proposed `evaluation/baselines/v0.6.0-pre-format-02` contains 87 original
files, 634,414 bytes: all 65 previous inputs plus these five tests and seventeen
required dependency files. Its manifest is
`8786bffcb36d65297c178cc47390f5b778f175b0db182584d9ba79bf568153d9`.
All copied bytes match their original repository sources. Revision 01 stays
unchanged; its manifest and every input are checked by the added preservation
test. The existing fork project selects revision 02's seventeen suites.

One current `repository.test.ts` assertion also computed the published v0.6.0
compatibility digest from the live Skill. It now uses the preserved
integration-12 Skill file, keeping the published evidence digest unchanged.
Current Skill structure/content and output-profile tests still inspect the live
candidate. No hash assertion or validator is relaxed, and no test is skipped.

## Pending Application Scope

The main checkout still has revision 01 and the unchanged formal Skill.
The following changes exist only in the rehearsal and application patch:

| Existing path | Change |
| --- | --- |
| `skills/fe-code-review/SKILL.md` | Existing accepted +325-byte Quick/Deep ledger-only clarification, explicitly excluding Fix. |
| `skills/fe-code-review/references/quick-review.md` | Existing accepted +231-byte template correction. |
| `skills/fe-code-review/references/deep-review.md` | Existing accepted +231-byte template correction. |
| `tests/skill-content.test.ts` | Two literal-state assertions replace obsolete combined-language placeholders. |
| `scripts/pre-format-baseline.mjs` | Select and pin the expanded historical archive. |
| `tests/pre-format-baseline-routing.test.ts` | Check 87 inputs and seventeen suites, plus preservation of revision 01. |
| `tests/repository.test.ts` | Bind published v0.6.0 evidence to its preserved source. |

The patch changes seven existing files and adds 89 archive files: 87 exact
inputs, a manifest and a README. This archive remains outside the installed
Skill. The prior migration is already present in the main working tree and
is not redundantly reapplied. Existing unrelated work is outside this patch.

The original seven files are preserved under `before-application/` in the local
evidence directory. Both application and any later bounded rollback must check
expected current bytes and preserve unrelated work; there is no blanket reset.

## Evidence And Limits

Evidence is in `.local-evaluation/format-adoption-combined-01/`: preparation,
initial failure, expanded-baseline recipe, focused/final JSON results,
`pending-application.patch`, original files and `rehearsal-receipt.json`.
The isolated workspace is `/private/tmp/fe-format-adoption-combined-499ZFe`.
At rehearsal closeout, all 781 main source files and 217 protected pins were
unchanged. Later status updates modify only the living plan and roadmap;
their preceding exact revisions are retained in this evidence directory.

The earlier missing File Coverage freeze remains missing and unverified. The
accepted Quick and two Deep reports are retained, not rerun or re-scored.
No new model/provider request, credential operation, dependency installation,
formal Skill application, version change, commit, push or release occurred.
Fix runtime, English runtime, cross-client behavior, automatic discovery and
matched token/latency evidence retain their existing limitations.

## Next Action

Apply the reviewed patch after authorization, verify all twelve installed files
against the accepted candidate, then run the applicable checks. The installed
Skill symlink points to the main source tree, so application changes subsequent
local Skill reads immediately. The stable published tag remains v0.6.0; release
preparation and Git delivery are separate actions.

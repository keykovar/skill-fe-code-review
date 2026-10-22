# Format-Only Formal Application

2026-10-22: **Applied locally and verified.** The reviewed patch is now in the
formal Skill tree and visible through the existing installed symlink. The
published release remains v0.6.0; no commit, push, tag or release occurred.

## Applied Scope

The exact patch from the [combined rehearsal](ledger-format-combined-rehearsal.md)
was applied after the user continued the explicitly proposed application step.
Its SHA-256 is
`b1e5303bb879207fa43b58b915df519c78138272d32e94cb6e301b3ccbaa2a6d`.

Only three installed files change: core plus Quick/Deep references. Coverage
contains ledger items and blank lines; explanatory material belongs in
Evidence; each item uses one final Disposition. The core explicitly excludes
a Fix Coverage ledger. Fix reference, metadata, collector and framework
references retain their bytes. This does not add File Coverage, a new mode,
probability estimation or rule compression.

Four maintainer files also change: two template assertions, the historical
baseline selector, its routing checks and the published-evidence assertion.
The new archive adds 89 files (87 original inputs plus manifest and README).
Seventeen unchanged historical suites now use revision 02; revision 01 remains
intact. The original recipes, validators, archived tests and expected hashes
are preserved. The prior baseline migration is not reapplied.

## Verification

| Check | Result |
| --- | --- |
| Pre-application identity | All seven target files and their backups match; all 89 new paths are absent; frozen patch and receipt hashes match. |
| Exact application | Seven existing files and 89 added files match the rehearsed after-state. |
| Unrelated source preservation | All 775 other existing repository files unchanged immediately after application. |
| Installed Skill identity | All twelve files match candidate manifest `61460297bc2bb429e046ae8bcfe0dc5b762a8171d80a4e5c3dcaa31a2c6e4298`. |
| Full Vitest run | 1,699/1,699 across 81 files; no skipped tests. |
| Historical routing | Seventeen suites, 361 checks; no duplicate original-suite execution. |
| Repository and official Skill shape validators | Both Pass with the existing isolated Python environment. |
| Whitespace and patch checks | `git diff --check` and read-only reverse application check Pass. |

The installed path `/Users/keykovar/.agents/skills/fe-code-review` still resolves
to the repository's `skills/fe-code-review`. Core SHA-256 is now
`a6a48d9cc162611e7969279f638733749facddb09766de41c40dc6abd741ccf7`.
New tasks read the updated instructions; existing tasks may retain previously
loaded text. No client restart or reinstallation is required for a fresh read.

## Preserved Evidence

Application evidence is retained in `.local-evaluation/format-adoption-apply-01/`:
preflight, exact application receipt, full JSON test results and final identity
receipt. The seven before-state files remain in the combined-rehearsal evidence
directory. Previous plan/roadmap revisions are also preserved before updating
their living status. No historical failure or runtime report is rewritten.

The previously missing older File Coverage freeze remains unverified. Local
application does not create new Fix, English, Cursor/Claude, automatic-discovery
or cost evidence; the accepted Quick and two Deep runtime reports are reused
with their existing limits. `runtimeReady=false` remains unchanged.

## Next Step

Prepare the narrow patch-release change summary and delivery scope, keeping
the experimental File Coverage work separate. Any version choice and GitHub
delivery require their own requested scope. The local Skill can already be
used in a new task. No additional model evaluation is needed merely to repeat
the accepted cases.

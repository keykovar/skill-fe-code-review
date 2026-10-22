# Format-Only Historical Baseline Isolation

2026-10-21: **Local isolation Pass; combined application rehearsal is next.**
The accepted format-only candidate and the formal/installed Skill are unchanged.
This completes step 1 of the [adoption plan](../ledger-format-adoption-plan.md).

## Change

`evaluation/baselines/v0.6.0-pre-format` retains 65 original repository files,
472,427 bytes: twelve v0.6.0 Skill files, twelve historical test suites, their
helper and the required recipes, fixtures, examples and validators. It is
distinct from the older `pre-v0.6.0` baseline. Its manifest digest is
`b761416d4e95b643e0fccacda19cfd722a4c99712e3b9b7bb098c157cd2a6516`.
All 65 copies match their original source bytes at migration time.

The Vitest configuration assigns those twelve suites to a separate
`v0.6.0-pre-format` fork project and excludes their original copies from
`current`. The fork setup selects the baseline cwd and restores the previous
cwd after each suite. Frozen relative imports, source hashes and tests that
use `process.cwd()` resolve to the same preserved tree. Current Skill structure,
content, output-profile and example checks continue to use the main tree.

One existing historical-routing assertion also compared integration-12's
accepted v0.6.0 output to the live Skill. It now compares against the saved
v0.6.0 output. The accepted hash is unchanged. The new routing test checks that
original historical suite files still match the executed archived copies, so
editing an excluded original does not silently lose a test change.

The baseline verifier rejects a changed manifest, input bytes, missing/extra
files and non-regular files before dispatch. No compatibility alias, skipped
anchor, relaxed validator or rewritten historical manifest is introduced.
No runtime data or credential file is included. Synthetic test configurations
remain synthetic. This directory is maintainer data, outside the installed Skill.

## Validation

| Check | Result |
| --- | --- |
| Minimal two-project cwd probe, one worker | 2/2, with restoration between suites. |
| Unchanged historical suites | 269/269 across twelve files. |
| New routing and drift controls | 7/7. |
| Complete current-tree Vitest run | 1,698/1,698 across 81 files; zero skipped. |
| Full-run historical dispatch inventory | Exactly twelve historical files and 269 checks; no duplicate original-file execution. |
| Original format builder in archived root | Reproduces accepted manifest `61460297bc2bb429e046ae8bcfe0dc5b762a8171d80a4e5c3dcaa31a2c6e4298`. |
| Changed sibling live-Skill control | Both builds retain that accepted manifest. |
| Protected sources and retained runtime evidence | Unchanged; see the preservation receipt. |

The full run took approximately 26 seconds in this local environment. It is a
deterministic regression result, not review latency or a new provider/model
evaluation. The existing synthetic preparation tests exercise rejection of
changed material hashes, delivery instructions and dispatch inputs; they do
not dispatch any external review. The old builder remains deliberately strict.

## Preservation

Before the documentation update, all 123 proposal protection pins and eleven
proposal receipt pins matched. The updated adoption plan and roadmap are
living status documents; their previous exact revisions are retained in
`prior-docs/` under the local evidence directory. The receipt distinguishes
these two intentional documentation updates from unchanged original-path pins.
The previous closeout report and all frozen recipes, tests, validators,
candidate bytes, runtime reports and receipts remain unchanged.

The earlier missing File Coverage freeze stays missing and unverified:
`/private/tmp/fe-file-coverage-ledger-dedup-deep-01-20261016/control/freeze.json`.
It is not reconstructed, and no full original-path historical availability
claim is made. The retained format-only acceptance records remain available.

Evidence: `.local-evaluation/pre-format-baseline-01/`, including the exact-copy
generator, cwd probe, scoped/full JSON test results, original routing test,
prior documentation revisions, migration patch and preservation receipt.

## Next Gate

Rehearse the accepted three Skill changes, two template-assertion adjustments
and this baseline migration together in a fresh isolated workspace. Verify
the exact twelve candidate files and the historical/current test split before
presenting the complete application diff. Do not repeat accepted runtime cases
just to accumulate passes. Formal application, commit, push, version selection
and release remain later actions; none occurred in this step.

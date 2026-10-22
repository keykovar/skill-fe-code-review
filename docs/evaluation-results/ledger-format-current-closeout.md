# Format-Only Current Closeout

2026-10-19: **Offline closeout Pass; the isolated candidate is unchanged.**
Following the [dedup diagnosis](large-diff-file-coverage-ledger-dedup-offline-diagnosis.md),
the existing format-only candidate was checked against its original manifest,
current formal sources, accepted Quick/Deep deliveries and retained reports.
No new Skill copy, runtime task, installation or promotion was made.

## Exact Scope

Candidate manifest SHA-256 remains
`61460297bc2bb429e046ae8bcfe0dc5b762a8171d80a4e5c3dcaa31a2c6e4298`.
All twelve candidate files and all twelve recorded formal sources match their
pins. Applying the existing pure clarification functions in memory reproduces
the candidate's changed bytes exactly; no new instruction rewrite is needed.

| Candidate path | Change from formal v0.6.0 |
| --- | --- |
| `SKILL.md` | +325 bytes: explicitly limit Quick/Deep Coverage to ledger items and blank lines; put explanations in Evidence; preserve Fix scope. |
| `references/quick-review.md` | +231 bytes: move guidance outside the output template and use literal Disposition syntax. |
| `references/deep-review.md` | +231 bytes: the same template correction for Deep. |
| Other nine files | Byte-identical, including Fix, metadata, collector and framework references. |

Each selected Quick or Deep review loads 556 additional instruction bytes
(core plus one mode reference). This is a byte measurement, not a token or
cost forecast. The candidate contains no File Coverage feature, inventory-only
collector or new review mode. Important rules remain in core; they are not moved
into optional references. The installed symlink still resolves to the formal
repository Skill rather than this isolated candidate.

## Local Validation

**191/191 tests pass across six suites:**

| Suite | Passed |
| --- | ---: |
| Isolated ledger-format candidate | 12 |
| Bounded review materials | 18 |
| v0.6.0 output profile | 98 |
| Output examples | 15 |
| Quick preparation | 21 |
| Deep read-call template | 27 |

These checks cover exact edit scope, retained rules, bilingual list grammar,
moving caveats to Evidence, repeated-ID rules, unchanged public output profiles,
byte-exact packaging and rejected malformed delivery. They are deterministic
checks, not fresh model reviews. No tests were added that simply repeat the
implementation, and no unrelated full-suite run was required.

The repository and current installed official Skill shape validators both
return `Skill is valid!`. They use the existing isolated Python/PyYAML runtime;
no package or system configuration was installed or changed. Both historical
material-window verifiers also pass. The closeout records 61 unchanged hashes
for candidate/formal files, recipes, reports, sessions, receipts and validation
evidence.

## Historical Evidence Reuse

The retained raw sessions and reports match their original evidence manifests.
Each final report matches both its session final message and completion record.
The four recorded visible-read receipts per run match the current frozen
manifest and three batch payloads. Reconstruction recovers all fifteen Quick
and nine Deep evidence files; every selected Skill file exactly matches the
existing candidate. The unchanged parser still accepts both reports.

| Accepted historical case | Reconfirmed scope | Remaining limit |
| --- | --- | --- |
| [FC-Q-001 Quick](ledger-format-quick-runtime.md) | Two independent Risk findings, twelve Coverage entries, repeated Finding-ID merge key, recorded 10/10 manual checks. | One Chinese synthetic pilot; no repeated reliability or matched cost result. |
| [FC-D-001 Deep Window 04](ledger-format-deep-read-call-runtime.md) | Zero findings, nine Coverage entries, missing session target retained as Cannot Verify, recorded 8/8 manual checks. | Does not exercise nonempty Deep Findings or repeated-ID Deep rendering. |

Both historical sessions used client `0.162.0-alpha.17.2`, provider `custom`
and `gpt-6-astra / xhigh`. This closeout reuses those exact records, not a fresh
current-client result. Their previous manual assessments are preserved; they
are not counted as a new independent semantic review. Runtime scope compliance
does not prove enforced filesystem isolation.

2026-10-20 follow-up: [one new LF-D-002 Deep findings pilot passes](ledger-format-deep-findings-runtime.md).
Client `0.163.0-alpha.10.2` with `custom / gpt-6-astra / xhigh` performs exactly
four frozen reads and reconstructs nine files. The unedited report contains two
Risk/New/Not Run findings and five Coverage entries; repeated F-001 uses a
consistent supported Merge key. The unchanged public parser and 8/8 manual
semantic checks pass. Elapsed is 192,114 ms within the frozen 900,000 ms ceiling.
This is a new distinct-case result, not a repeat or a matched efficiency trial.

## Remaining Gates

| Area | Current evidence | Next action |
| --- | --- | --- |
| Deep with actual findings and repeated IDs | LF-D-002 single pilot passes: two independent findings, repeated-ID rendering exercised and 8/8 manual checks. | Gap closed for this case; retain evidence without rerunning it to accumulate passes. |
| Fix | Reference bytes unchanged; new core wording explicitly applies to Quick/Deep and excludes a Fix ledger. | Retain this boundary in local checks; do not claim a new Fix runtime pass. |
| English output | Offline template/profile/example coverage only. | Keep runtime status unverified; no automatic extra task. |
| Cursor, Claude, discovery and installed workflow | No new exact-candidate evidence from these two Codex pilots. | State the limit until an applicable independently authorized acceptance is needed. |
| Token, elapsed time and billed cost | No accepted matched control. | Preserve frozen thresholds; do not compare against failed or differently delivered historical runs. |
| Large-diff File Coverage | Separate experimental candidate. | Keep outside this format correction and its acceptance claims. |

## Next Step

2026-10-21: [the local adoption proposal and rehearsal are complete](../ledger-format-adoption-plan.md).
The exact three-file patch passes a read-only application check. Four selected
suites pass 141/141 in an isolated candidate workspace after a two-line
template-assertion update; the initial 140/141 run is retained. Both shape
validators pass. Applying the candidate also reproduces an old-builder anchor
failure, while the preserved v0.6.0 baseline rebuilds the exact accepted
manifest. Next isolate historical test inputs before formal application.
The new plan records one unavailable older File Coverage temporary freeze;
103/104 inherited pins match, and the selected format-only reports/materials
remain available. No formal Skill change or model call occurred.

The [LF-D-002 single runtime acceptance](ledger-format-deep-findings-runtime.md)
now closes the previously uncovered nonempty/repeated-ID Deep path. Its raw
report, delivery trace and 8/8 manual judgments are retained outside the frozen
packet. At runtime completion on October 20, all 99 protected history/formal
hashes and five preparation pins matched; the October 21 availability exception
is recorded above. The existing public parser's linked-location normalization passes;
logical packet links do not establish clickable local-file availability.

Next isolate historical v0.6.0 test inputs, then rehearse the complete narrow
application scope described in the prepared proposal. Reuse the accepted Quick
and two distinct Deep reports; retain Fix, English, cross-client,
installed-workflow and cost limits explicitly. Do not rerun accepted cases, start a broad client/model
matrix, apply the candidate or promote the separate File Coverage experiment
automatically.

Evidence is retained in `.local-evaluation/ledger-format-closeout-01/`:
`audit.mjs`, `vitest.json` and `closeout.json`. Formal/installed v0.6.0,
historical failures and `runtimeReady=false` remain unchanged. The October 19
offline closeout made no external request; the separately authorized October 20
LF-D-002 run sent only its frozen public materials. No Git delivery or release
occurred in either step.

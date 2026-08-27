# Post-v0.4.0 Grouped Ledger Migration Brief

Status: Candidate 03 `No-Go`; Stage 1 stopped after invalid D-ID-001 RUN-01; rolled back to stable v0.4.0

Date: 2026-08-27

## Purpose

This brief defines the exact smallest prospective change for a Finding-grouped Changed-Condition Coverage ledger. It is an offline migration contract, not an implementation or runtime authorization. The stable v0.4.0 Skill, installed symlink, current output validator, and frozen historical results remain unchanged.

## Readiness Evidence

- The grouped-ledger parser prototype passed `14 / 14` targeted tests.
- Seven saved synthetic Markdown cases replayed `7 / 7` against their frozen structural expectations.
- The saved set contains two structurally and semantically valid examples, four structurally invalid examples, and one structurally valid example that the Q-ID semantic oracle must reject.
- No model call, network request, source transfer, automatic repair, or candidate runtime occurred.

The replay proves parser determinism for these saved shapes. It does not prove that a model will produce the schema reliably or that any merge basis is semantically true.

## Allowed Implementation Scope

Only a separately frozen future candidate may change:

1. `skills/fe-code-review/SKILL.md`: Finding finalization step 5 only.
2. `skills/fe-code-review/references/quick-review.md`: the ledger-rendering sentence, Chinese ledger template, and one English-template sentence only.
3. `skills/fe-code-review/references/deep-review.md`: the same three changes as Quick only.
4. `scripts/validate-review-output.mjs`: replace the flat coverage parser with grouped parsing while preserving the CLI and result boundary.
5. Direct deterministic assertions and grouped-ledger validator tests.
6. Promote, not copy, `evaluation/prototypes/grouped-ledger-validator.mjs` into evaluator tooling if a shared module remains necessary.

Everything else is frozen at zero change:

- Fix reference and Fix output contract;
- frontmatter and `agents/openai.yaml`;
- Codex, Claude Code, and Cursor adapters;
- context collector and trace auditor;
- semantic fixtures and oracles;
- severity, recommendation, minimal-design, read-only, Context7, Playwright, and client-isolation rules;
- review modes, model rounds, MCP permissions, and source-transfer policy.

## Exact Prompt Replacements

### Core Finding Finalization

Replace exactly once:

```text
Backfill final IDs into the visible ledger and cross-section references. Group ledger entries by final ID: repeated IDs require the same non-empty `Merge key` / `合并依据` on every entry; single IDs require none. Reconcile every actionable statement outside severity sections: reference a final ID or remove it.
```

with:

```text
Backfill final IDs into visible ledger groups and cross-section references. Render each final ID once as a group containing its changed conditions. A multi-condition Finding group requires one non-empty `Merge basis` / `合并依据` stating the indivisible repair or acceptance result; omit it for single-condition and non-Finding groups. Reconcile every actionable statement outside severity sections: reference a final ID or remove it.
```

### Quick And Deep Rendering Sentence

In each mode reference, replace exactly once:

```text
Apply the `Finding Requirements` finalization sequence before rendering. Keep discovery keys and acceptance sentences internal; expose the ledger only after final IDs are backfilled. Render each independently assessable changed condition, return-value contract, or observable behavior in its own `before -> after` entry, ending in one final Finding ID, `Behavior Preserving`, or `Cannot Verify`. Never summarize independent changes. Complete the repeated-ID ledger check in `SKILL.md` before responding.
```

with:

```text
Apply the `Finding Requirements` finalization sequence before rendering. Keep discovery keys and acceptance sentences internal; expose the ledger only after final IDs are backfilled. Render one group per final Finding ID, `Behavior Preserving`, or `Cannot Verify`, then place every independently assessable changed condition, return-value contract, or observable behavior under its group as a separate `before -> after` entry. Never summarize independent changes. Apply the group-owned merge-basis rule in `SKILL.md` before responding.
```

### Quick And Deep Chinese Template

In each mode reference, replace exactly once:

```md
- [file:line] 条件：修改前 -> 修改后；结论：[F-001] / Behavior Preserving：行为保持 / Cannot Verify：无法验证；合并依据：<仅重复 ID 时填写同一简短键>
```

with:

```md
- [F-001]
  - 合并依据：<仅多个条件确属同一原子修复时填写一次；单条件省略>
  - [file:line] 条件：修改前 -> 修改后
- Behavior Preserving：行为保持
  - [file:line] 条件：修改前 -> 修改后
- Cannot Verify：无法验证
  - [file:line] 条件：修改前 -> 修改后
```

### Quick And Deep English Template

Insert exactly once before the existing `Under Evidence` sentence in each English output-template paragraph:

```text
Under `Changed-Condition Coverage`, render each disposition once as a group; use one `Merge basis` only for a multi-condition Finding group and keep every child as a located `before -> after` entry.
```

No other runtime instruction is allowed in this prospective delta.

## Frozen Word Budget And Hashes

Count English words with `/[A-Za-z]+(?:[-'][A-Za-z]+)*/g`, matching prior candidate accounting.

| File | Baseline words | Prospective words | Net | Maximum | Baseline SHA-256 | Prospective SHA-256 |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `SKILL.md` | 3766 | 3780 | +14 | +20 | `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286` | `a8b81157abe92c944143a28386ffd9f86c25711ee7ab40d17e2ea0b6a514cb7e` |
| Quick reference | 643 | 681 | +38 | combined below | `3d8d775387ff91d7fffd5711957a0af13b2f9d52d4036f4214c1d208c0a58d17` | `91fe031195f6018ecbf29c48aab5fc26477f9262b40eb7dd4d149b2294c7a9ed` |
| Deep reference | 719 | 757 | +38 | combined below | `9fef69f9db11cc846ad3cb2231f1ede1307227df83465ee8e3404cb5e6fcc276` | `44d1fb20cfc2f3b9814943d5254e2349387a8b17832eab27b618a2a2a3bedc36` |
| Quick + Deep | 1362 | 1438 | +76 | +80 | n/a | n/a |
| Fix reference | 519 | 519 | 0 | 0 | `8380289a00f3c2f1a1ea740bc824b1a53813d6839b3957cae3c54c0e27757d33` | unchanged |

Frontmatter, adapter, collector, trace-auditor, and Fix-reference net words are exactly zero. Any hash or count mismatch invalidates implementation before a runtime request.

## Validator Migration

The existing `evaluation:review-output` CLI and `validateReviewOutput(markdown, mode)` API remain the authority. Do not add a second public validator or an automatic normalizer.

For Quick and Deep only:

1. Parse exactly one coverage section.
2. Parse one top-level group per final Finding ID, `Behavior Preserving`, or `Cannot Verify`.
3. Require each group to contain at least one located child with an explicit `before -> after` transition.
4. Require a multi-condition Finding group to contain exactly one non-empty merge basis.
5. Forbid a merge basis on a single-condition Finding or non-Finding group.
6. Require group IDs to be unique, sequential, and equal to the Findings rendered in severity sections.
7. Keep `coverageLedgerEntries` as the child-condition count so the result object does not drift unnecessarily.
8. Reject legacy flat entries for the prospective schema; do not silently auto-detect or auto-convert them.

Preserve existing error names where semantics are unchanged. Add group-specific errors only for group headers, nesting, group duplication, merge-basis count, and Finding-set mismatch. The validator may prove structure and references only. It must not generate a merge basis, combine or split groups, renumber semantic concepts, change severity, or convert invalid output into a pass.

Fix Review continues through the existing Issue Verification parser and must reject a Changed-Condition Coverage section exactly as v0.4.0 does.

## Deterministic Test Migration

A future implementation must pass before any model request:

- all current tests, updated only where the public Quick/Deep ledger grammar intentionally changes;
- saved replay `7 / 7` with the same case hashes;
- Chinese and English complete Quick/Deep reports using grouped coverage;
- Markdown-linked child locations;
- single and multiple condition groups;
- Behavior Preserving and Cannot Verify groups;
- missing, empty, duplicate, and forbidden bases;
- malformed nesting, legacy flat entries, duplicate/non-sequential/unknown/missing IDs;
- structurally valid but semantically invalid merge retained as a structural pass and semantic failure;
- unchanged Fix output and Fix validator behavior;
- both Skill validators, Node syntax, all JSON parsing, sensitive-value scan, and `git diff --check`.

## Runtime Gate If A Candidate Is Later Frozen

Candidate designation is deliberately deferred. A future freeze must record exact implemented hashes, fresh public synthetic workspaces, an isolated source-free probe, and a zero-retry run order.

Stage 1 should contain, in order:

1. `D-ID-001 RUN-01`, because it requires one valid multi-condition Finding group.
2. `Q-ID-001 RUN-01`, because it requires two valid multi-condition groups plus one single-condition group.
3. A byte-identical `Q-ID-001 RUN-02` only if the first two runs pass every gate.

Stage 2 may reuse the remaining frozen public synthetic matrix only after Stage 1 passes completely. Every source-bearing run requires separate authorization. Structural, semantic, severity, recommendation, collector, read-only, client-isolation, and workspace-integrity gates remain independently mandatory.

## Stop And Rollback Boundary

Stop immediately and retain `No-Go` without retry, replacement, reinterpretation, or mode switch when any of these occurs:

- required Finding recall, precision, severity, stable ID, design decision, or recommendation regresses;
- a structurally valid output merges independently repairable contracts;
- a grouped output omits, duplicates, or misplaces a required group or basis;
- a Fix result or read-only, collector, trace, isolation, or integrity gate regresses;
- an exact hash, word budget, fixture, or saved-replay expectation changes unexpectedly.

Rollback means restoring all runtime Skill and reference files to the v0.4.0 hashes above and restoring the current validator behavior. Retain the failed candidate plan, outputs, trace audit, hashes, and decision as evidence. Do not publish, tag, or update installation guidance from a failed window.

## Candidate 03 Implementation

Post-v0.4.0 Grouped Ledger Candidate 03 applies exactly the replacements and validator migration above. The implemented Skill and mode-reference hashes match the prospective hashes, Fix remains unchanged, and the grouped parser is promoted to evaluator tooling without an automatic normalizer or second public validator.

Local closure passed `10 / 10` Vitest files and `127 / 127` tests, saved replay and case hashes `7 / 7`, both Skill validators, Node syntax `6 / 6`, JSON parsing `115 / 115`, the sensitive-value scan, installed-candidate and unchanged-Fix hashes, and `git diff --check`. No external model request or source transmission occurred.

Seven fresh public synthetic workspaces passed expected-test and complete integrity gates, and the isolated Cursor source-free probe returned exactly `CLIENT_ISOLATION_OK` with zero tools, MCP calls, retries, violations, source transmission, or workspace changes. Candidate 03 is therefore runtime-frozen, but every source-bearing run still requires separate authorization. The machine-readable boundary and zero-retry order are recorded in [`evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-03-plan.json`](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-03-plan.json).

The separately authorized `D-ID-001 RUN-01` did not preserve the frozen Prompt. Shell interpolation removed the leading Skill variable and executed backtick-delimited examples in the main repository, injecting main-worktree status, tracked diff, and test output into the Cursor request. The model output itself matched the expected semantic and grouped-ledger shape, but prompt integrity, transfer scope, and collector gates failed before promotion scoring. Candidate 03 is `No-Go`; every remaining run was stopped without retry, replacement, reinterpretation, or mode switch. The runtime Skill, Quick/Deep/Fix references, and public review-output validator have been restored to the stable v0.4.0 boundary. Candidate 03 remains available only as offline evaluator evidence. Rollback closure passed `10 / 10` Vitest files and `127 / 127` tests, saved replay `7 / 7`, both Skill validators, Node syntax `5 / 5`, JSON parsing `52 / 52`, the sensitive-value scan, installed-stable hashes, and `git diff --check` without an external model request or source transmission. After separate authorization, all 13 Candidate 03 temporary Cursor credential, trace, extracted-output, probe, and prepared-workspace items under the frozen `/private/tmp` prefix were deleted; the remaining-prefix count is zero and sanitized repository evidence is retained.

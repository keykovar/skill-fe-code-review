# Post-v0.4.0 Grouped Ledger Candidate 14 Evaluation Plan

Status: No-Go at Stage 1; remaining runtime runs cancelled

Date: 2026-09-04

## Purpose

Candidate 14 closes one contract mismatch found after Candidate 13 was applied locally. The core Skill required a single Finding ID to have no `Merge key`, but the Quick/Deep examples and output validator accepted one. The corrected contract now rejects a merge key for a single Finding ID while preserving the existing requirement that every repeated Finding ID use the same non-empty merge key.

## Bounded Delta

The candidate changes only:

- Quick and Deep examples for single-ID and repeated-ID merge-key behavior.
- The deterministic review-output validator rule for a single Finding ID.
- English and Chinese positive/negative fixtures and their tests.
- Historical Candidate builder restoration needed to keep old fixed hashes reproducible.

Review scope, Finding discovery, severity, recommendation, Fix Review, Context7/Playwright policy, read-only behavior, source-transfer policy, and client adapters remain unchanged. The `SKILL.md` entrypoint remains SHA-256 `b6124c8866992d5c720a4c9183740b6e19fdacea4beafb76d2da5952f5fc845e`. The corrected 12-file distributable Skill tree is SHA-256 `beca476371288fc96b28fc5f58d619dca81fbf3b336d5125e7fc64979ba16fcb`.

## Local Validation

- Default Vitest: `30/30` files and `192/192` tests passed.
- Single-worker Vitest: `30/30` files and `192/192` tests passed.
- Corrected review-output fixtures: `10/10` passed.
- Grouped-ledger replay: `7/7` passed.
- Repository and official Skill validators: passed with isolated PyYAML 6.0.3.
- Candidate 13/14 preparer and fixture-focused tests: `3/3` files and `3/3` tests passed.
- Node syntax: `33/33` JavaScript files passed; JSON parsing: `96/96` files passed.
- The sanitized freeze record matches the local manifest for both run hashes and all shared control hashes.
- The repository, installed, and frozen distributable Skill trees match at 12 files with SHA-256 `beca476371288fc96b28fc5f58d619dca81fbf3b336d5125e7fc64979ba16fcb`; local `.plugin-eval` data is excluded from distribution.
- The targeted personal-path and sensitive-identifier scans report zero matches, `git diff --check` passes, and the staging area remains empty.

## Offline Freeze

The evaluator prepared two fresh public-synthetic workspaces under `/private/tmp/post-v0.4.0-grouped-ledger-candidate-14-offline-freeze-01`:

1. `Q-ID-002/RUN-01` in Quick mode verifies that independently reported single Finding IDs omit `Merge key`.
2. `D-ID-001/RUN-01` in Deep mode verifies that multiple Coverage entries mapped to one Finding ID retain the same non-empty `Merge key`.

Both locally declared `node --test` exits matched their expected failure result (`2/2`). An independent second pass matched Git status, complete workspace tree, and installed Candidate Skill tree for both workspaces (`2/2`). The sanitized [offline freeze record](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-14-offline-freeze.json) contains only public-synthetic hashes and normalized paths.

Offline preparation called Cursor only with `--version`. It made zero model requests, transmitted no source, read no credentials, and did not authorize a source-bearing run.

## Runtime Matrix

### Stage 0: Cursor Source-Free Probe

Use a fresh isolated Cursor HOME and a fresh Git workspace containing only the Candidate 14 public Skill plus a public probe file. Require exact sentinel output, one successful workspace-local read, zero Shell/MCP/write calls, no outside-workspace reads, no client warning or mode drift, and unchanged Git status/tree. A failure stops Candidate 14 without retry or replacement.

The separately authorized probe passed on 2026-09-04. Cursor Agent CLI `2026.08.11-e8db854` ran exactly once through runner v5 in Plan mode with client sandbox enabled and the outer Seatbelt profile. The process exited `0` with empty stderr. The dedicated auditor reported `valid: true`, one successful workspace-local read of `probe.txt`, zero Shell/MCP/other tool calls, exact final response `PLAN_READ_ONLY_OK`, a matching result aggregate, and unchanged Git status/tree hashes. The sanitized [probe result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-14-probe-result.json) retains hashes and counts without raw trace, account, session, or credential data.

This is only a client-isolation and read-capability precondition. It provides no review-quality evidence and does not authorize either source-bearing run. No project, fixture, customer, production, or private source was transmitted.

### Stage 1: Cursor Quick Review

Run frozen `Q-ID-002/RUN-01` exactly once. Require:

- Both independent expected Findings with sequential IDs and allowed severities.
- Every Coverage entry references one Finding ID exactly once.
- No single-ID entry contains `Merge key` or `合并依据`.
- Output validator, semantic oracle, trace audit, read-only, client-isolation, test-evidence, and workspace-integrity gates all pass.

The separately authorized run executed exactly once on 2026-09-04. Runner preflight and postflight passed with exit `0`, empty stderr, and unchanged Git status/workspace hashes. The final Review found both expected independent issues as sequential `F-001` Blocking and `F-002` Risk, emitted two complete Coverage entries without single-ID merge keys, recommended `修改后提交`, and passed both the output validator and semantic oracle.

The runtime audit failed a mandatory isolation gate. Cursor attempted to read `tests/contracts.test.mjs` through a misspelled `freeze-workspaces` path outside the real `freeze/workspaces` root, received `File not found`, and then read the corrected workspace-local path. This is both an outside-workspace read attempt and a tool retry after failure. Candidate 14 therefore stopped `No-Go`; the semantic success does not override the safety failure. The sanitized [Stage 1 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-14-stage-1-result.json) records hashes, counts, token usage, and the normalized violation without raw trace, account, session, request, or credential data.

### Stage 2: Cursor Deep Review

Run frozen `D-ID-001/RUN-01` exactly once only after Stage 1 passes. Require:

- The stale-session ownership Finding with its allowed severity and `Simplify` decision.
- Every independently assessable changed condition is represented.
- Every repeated Finding ID entry contains the same non-empty `Merge key` or `合并依据`.
- Output validator, semantic oracle, trace audit, read-only, client-isolation, test-evidence, and workspace-integrity gates all pass.

Not executed. Stage 1 failed, so the Deep and Codex smoke runs were cancelled without retry, replacement, reinterpretation, or mode switch.

### Stage 3: Codex Quick Smoke

After a separate Codex source-free isolation check, review the same frozen `Q-ID-002/RUN-01` public-synthetic workspace once. Apply the same single-ID, semantic, output, read-only, scope, and integrity gates. Treat Codex user-level Memory or plugin context as an explicit isolation limitation when it cannot be disabled; do not reinterpret a behavior-only pass as a Skill-only token or isolation benchmark.

## Stop And Acceptance Rules

- No failed run is retried, replaced, reinterpreted, or switched to another mode inside this window.
- Any unexpected endpoint, client warning, Shell/MCP/write call, outside-workspace read, output-contract failure, semantic-oracle failure, or workspace mutation is `No-Go`.
- Cursor passes only at `2/2` source-bearing runs after the source-free probe passes.
- Codex runtime support is claimed only if its separate Quick smoke passes every declared applicable gate.
- No aggregate score overrides a failed mandatory gate.

## Next Gate

Candidate 14 is closed `No-Go`. Do not run the Deep or Codex smoke stages. Any further work starts with offline diagnosis and a separately defined candidate window. Commit, push, tag, release, installation changes, and temporary-data cleanup remain unauthorized.

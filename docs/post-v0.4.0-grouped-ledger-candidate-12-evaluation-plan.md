# Post-v0.4.0 Grouped Ledger Candidate 12 Evaluation Plan

Status: No-Go after first source-bearing run; remaining six runs cancelled by stop rule

Date: 2026-09-03

## Purpose

Candidate 12 addresses the single failure observed in Candidate 11: the Deep model emitted Changed-Condition Coverage as nested multi-line bullets, while the existing validator requires one physical Markdown bullet per condition with `before -> after` and a final disposition on that same line. Candidate 12 must preserve all review semantics, safety boundaries, and evaluator-owned context introduced by Candidate 11.

## Bounded Delta

The candidate may add one explicit rendering contract to `SKILL.md` and the Quick/Deep references:

- Every Changed-Condition Coverage entry is exactly one physical Markdown list item.
- The same line must contain `before -> after` and exactly one final disposition: `[F-NNN]`, `Behavior Preserving`, or `Cannot Verify`.
- Do not split a coverage entry into nested bullets or put `Disposition` on a child line.
- Repeated Finding IDs still require one identical non-empty `Merge key` / `合并依据` on every entry; single IDs require none.

The candidate must not change the grouped validator, Finding severity rules, recommendation matrix, Fix Review contract, runner, Seatbelt profile, collector, or source-transfer policy. The stable public and installed Skill remain unchanged until a candidate passes.

## Offline Fixture Result

A temporary 12-file Candidate 12 Skill copy was generated with tree SHA-256 `a3e4c860e6c5f7b926e3b51dc22f7be795746b9a7b1d577d8cbaa276f35cda6b`. The positive single-line Coverage fixture passed (`valid: true`, one ledger entry). The negative Candidate 11 nested multi-line fixture failed exactly on `coverage-ledger-missing-before-after` and `coverage-ledger-missing-disposition`. The public and installed Skill remain unchanged.

## Offline Acceptance

Before any external request:

1. Generate a temporary candidate Skill copy and record its complete tree hash.
2. Add local positive and negative output fixtures: the single-line contract passes; the Candidate 11 nested form fails.
3. Pass the full Vitest suite, grouped replay, both Skill validators, Node syntax, JSON parsing, Markdown links, sensitive-identifier scan, and `git diff --check`.
4. Prepare seven fresh public-synthetic workspaces using evaluator-owned tests, collectors, and Deep inventory.
5. Run a fresh source-free Cursor Read-tool probe with the unchanged runner and Seatbelt contract.

## Offline Freeze Result

The seven fresh public-synthetic workspaces were frozen under `/private/tmp/post-v0.4.0-grouped-ledger-candidate-12-offline-freeze-01`. All declared fixture exits matched `7 / 7`; the evaluator ran the non-Deep collector exactly once for `6 / 6` runs and froze the Deep inventory for `1 / 1` run. The Q-ID-001 and F-ID-001 repeat assertions match by HEAD, Prompt SHA-256, status SHA-256, and complete workspace tree SHA-256 (`2 / 2`). Every workspace carries Candidate 12 Skill tree SHA-256 `a3e4c860e6c5f7b926e3b51dc22f7be795746b9a7b1d577d8cbaa276f35cda6b`.

The sanitized [offline freeze record](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-12-offline-freeze.json) is SHA-256 `c6597e195800e1d386e2bf369f207fbd338e933cff158c38a8553406bb9105b8`. Preparation made zero external model requests and transmitted no source. The freeze manifest was corrected to Candidate 12 before this record was generated.

## Source-Free Probe Result

A fresh Candidate 12 Skill workspace and isolated file-backed Cursor HOME were used. The workspace contained only Git metadata, the 12-file Candidate 12 Skill, and public `probe.txt`; no fixture or private source was included. Cursor Agent `2026.08.11-e8db854` ran once through runner v5 with Plan mode, client sandbox enabled, and the outer Seatbelt profile.

The probe passed: runner exit `0`, stderr `0`, auditor `valid: true`, exactly one successful workspace-local Read-tool call, zero Shell calls, zero MCP calls, zero other tools, exact final response `PLAN_READ_ONLY_OK`, and unchanged workspace tree/status. The sanitized [probe result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-12-probe-result.json) is SHA-256 `1de3d983ea4e50a1869564ffa47c5610b3c04a410fc9309f5a5afb1bffb8664c`.

This proves only the Plan-mode file-read precondition. It does not prove review quality and does not authorize sending any Candidate 12 source-bearing workspace to an external model. The temporary HOME, workspace, raw trace, and prior failed-login directories remain outside the repository pending separate cleanup authorization.

## Source-Bearing Result

After explicit authorization, `D-ID-001/RUN-01` was executed first with the frozen Deep contract. Runner and runtime safety audit passed: exit `0`, `13` read-only tool calls, zero Shell/MCP calls, zero outside-workspace reads, zero writes, unchanged Git status/tree, and all frozen hashes matched. The model output then failed the Candidate 12 grouped-ledger validator: one `Changed-Condition Coverage` entry lacked the required `before -> after` transition (`line 53`).

The sanitized [Stage 1 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-12-stage-1-result.json) is SHA-256 `69700bca8e2b5d44046c471d90b8c8b0ea4d782775200d2b539ae3229c4c24a0`. Exactly one public-synthetic source-bearing request was made; no private source was transmitted. Candidate 12 stopped at `1 / 7` without retry, replacement, mode switch, or reinterpretation. The remaining six source-bearing runs were not executed.

## Runtime Gate

Source-bearing execution requires separate authorization after all offline gates pass. Execute the seven runs in frozen order, stop at the first static, transport, client-contract, output, read-only, isolation, or integrity failure, and never retry, replace, reinterpret, or switch mode. Private source remains forbidden.

## Candidate 11 Boundary

Candidate 11 is closed `No-Go` at `1 / 7`. Its failed output and remaining six workspaces are evidence only and must not be reused as Candidate 12 runtime input.

## Next Gate

Candidate 12 is closed `No-Go`. Do not retry `D-ID-001/RUN-01` or execute the remaining six runs. A future candidate requires a new frozen window, fresh evidence, and separate explicit authorization. Private source remains forbidden.

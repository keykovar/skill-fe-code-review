# Post-v0.4.0 Grouped Ledger Candidate 08 Evaluation Plan

Status: Candidate 08 `No-Go`; source-free Plan-mode probe failed output and strict read-only contracts

Date: 2026-08-28

## Purpose

Candidate 08 addresses the two independent failures from Candidate 07 without broadening review semantics. Candidate 07 remains `No-Go`; no result is retried, replaced, or reinterpreted.

The original Candidate 07 response was first replayed locally without a model request. The stable v0.4.0 flat-ledger validator reported 16 errors but was not the frozen Candidate 07 validator. The applicable grouped validator reduced the result to seven errors: three `Behavior Preserving` children used line ranges such as `[file:7-12]`, while two `Cannot Verify` children omitted a line number, which also left both groups empty. The Finding group, semantic oracle, severity, design decision, and recommendation were otherwise recognized. Candidate 08 therefore changes the Skill by one child-location rendering constraint instead of relaxing the validator or adding fields.

The execution failure is independent. Cursor Ask mode denied the single read-only Git inventory command. Offline fixture preparation had already executed `node --test` once and verified its expected exit code without changing Git state, so requiring Cursor to execute the same deterministic test again added cost and a client-permission failure without new evidence.

## Frozen Deltas

### Skill Rendering

Add exactly one instruction to the offline candidate:

> Ledger child locations must be exactly `[file:line]` with one line number; ranges and locationless labels are invalid.

The instruction adds 18 English words within a 20-word budget. Candidate 08 `SKILL.md` is SHA-256 `7c48a782f0580ce44d754bd2de11ab6195af47cce16752f1b0251971b632cf35`; its 12-file Skill tree is `d25f55a5e11dd59c2eb8f16f3d4650924e61d1bee05c6b19b6545c83b61ef18f`. Quick, Deep, Fix, the grouped validator, and the candidate review-output validator remain byte-identical to Candidate 07. No visible field, severity rule, recommendation rule, review scope, Context7 rule, Playwright rule, or read-only boundary changes.

### Cursor Contract

Use the Cursor CLI's advertised `plan` mode instead of `ask`:

```text
--print
--output-format stream-json
--mode plan
--sandbox enabled
--trust
--workspace <workspace>
<literal Prompt argv>
```

The frozen CLI describes Plan mode as `read-only/planning (analyze, propose plans, no edits)`. This is only a prospective contract until a source-free capability probe verifies that Plan mode can execute one read-only Shell command without permission fallback. `--auto-review`, `--force`, `--yolo`, and `--approve-mcps` remain forbidden.

### Deterministic Test Evidence

The offline evaluator executes `node --test` exactly once per fresh workspace before freezing it. The Prompt receives only the actual exit code. stdout/stderr SHA-256 values remain in the local manifest and raw test output is not sent to the model. Cursor is expected to execute zero test commands. Read-only Git inventory or the supported context collector remains model-owned because it is part of review scope discovery.

## Offline Freeze

`scripts/prepare-grouped-ledger-candidate-08.mjs` created seven fresh public-synthetic workspaces under `/private/tmp/post-v0.4.0-grouped-ledger-candidate-08-offline-freeze-01`. All declared test exits matched `7 / 7`; Q-ID-001 and F-ID-001 repeat pairs match by HEAD, Prompt SHA-256, and complete workspace tree `2 / 2`; each run expects zero Cursor-owned test commands.

The sanitized [offline freeze](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-08-offline-freeze.json) is SHA-256 `461821da80eb54b75defce78509b921b1b573992f0b0878ae90e6bfdc7a3668f`. Preparation made zero external model requests, transmitted no source, created no Cursor login, and changed neither the public nor installed Skill.

## Static Closure

Static closure passes `21 / 21` Vitest files and `160 / 160` tests, all seven grouped-ledger replay cases, both Candidate 08 Skill validators, and syntax checks for all three Candidate 08 scripts. JSON parsing passes `134 / 134`; local Markdown links pass `166 / 166` across 58 files; the sensitive-identifier scan reports zero matches; all seven frozen workspace hashes remain unchanged; and `git diff --check` passes.

These checks validate deterministic repository structure, candidate construction, transport constraints, and frozen evidence integrity. They do not establish Cursor Plan-mode capability or model review quality. No external model request ran and no source was transmitted during static closure.

## Source-Free Capability Probe Result

After separate authorization, a fresh isolated Cursor HOME and Git workspace containing only Git metadata plus the public Candidate 08 Skill executed exactly one Plan-mode probe. The process exited `0`, stderr was empty, one Shell call ran the exact `/usr/bin/git status --short --untracked-files=all` command successfully, no MCP ran, and the workspace remained unchanged. The final assistant message was exactly `PLAN_READ_ONLY_OK`.

The gate still failed for two independent reasons. Cursor's result event aggregated a pre-tool assistant message with the exact final response, so the overall result was not exactly `PLAN_READ_ONLY_OK`. The Shell event also requested `TYPE_WORKSPACE_READWRITE`; therefore Plan mode did not provide trace evidence of strict client-enforced read-only capability, even though the chosen command was read-only and no mutation occurred. The generic trace auditor additionally labels the explicitly required `/usr/bin/git` executable as `outside-workspace-read`; that inapplicable rule is not used as a failure basis.

The sanitized [probe result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-08-probe-result.json) records one external request, zero reviewed/private source transmission, zero retries, and unchanged public, installed, source-free, and seven frozen workspaces. No account, login URL, challenge, session, token, or Cursor state-file content is recorded.

## Prospective Runtime Window

The source-free capability gate did not pass. The prospective Stage 1 order was:

1. `D-ID-001 RUN-01`
2. `Q-ID-001 RUN-01`
3. `Q-ID-001 RUN-02`

Stage 2 was `Q-ID-002 RUN-01`, `F-ID-001 RUN-01`, `F-ID-001 RUN-02`, and `K-ID-001 RUN-01`. Candidate 08 is closed `No-Go`; none of these source-bearing runs is authorized or executed, and no retry, replacement, reinterpretation, or mode switch is allowed.

## Post-stop Closure

Post-stop closure passes `21 / 21` Vitest files and `160 / 160` tests, grouped replay `7 / 7`, both Skill validators, Candidate 08 Node syntax `3 / 3`, JSON parsing `135 / 135`, and Markdown local links `167 / 167` across 58 repository Markdown files. The targeted sensitive-identifier scan and `git diff --check` pass. All seven frozen workspaces and the source-free workspace remain unchanged; the public and installed Skill remain SHA-256 `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`.

The Candidate 08 window executed one source-free external request, zero source-bearing runs, zero retries, zero replacements, and zero mode switches. No reviewed or private source was transmitted.

## Next Gate

Candidate 08 remains `No-Go`; do not execute another probe or any source-bearing request. Installation, repository commit, push, release change, and temporary-data cleanup remain unauthorized.

# Post-v0.4.0 Grouped Ledger Candidate 10 Evaluation Plan

Status: Candidate 10 `No-Go`; source-free Plan-mode capability probe command was rejected

Date: 2026-08-28

## Purpose

Candidate 10 is a new evaluation-tooling-only window after Candidate 09 closed `No-Go`. It does not retry, replace, reinterpret, or relax Candidate 09. The Candidate Skill, mode references, grouped validator, visible output fields, severity rules, recommendation rules, review scope, and source-bearing matrix remain byte-identical.

Candidate 09 proved that wrapping Cursor with an outer Seatbelt profile while also passing `--sandbox enabled` prevents Cursor's inner `sandbox-exec` from applying its own sandbox. The required source-free Git command therefore failed with exit `71`. Candidate 10 removes only that nested-sandbox conflict.

## Frozen Delta

Runner v6 must preserve runner v5's literal argv transport, absolute executable checks, hash checks, isolated HOME, fixed Plan mode, forbidden permission flags, preflight and postflight Git status, complete workspace tree checks, Candidate Skill tree checks, fresh output paths, warning detection, and mandatory outer `/usr/bin/sandbox-exec` wrapper.

The only client-argument change is:

```text
--sandbox enabled
```

to:

```text
--sandbox disabled
```

This disables only Cursor's conflicting inner sandbox. The frozen outer Seatbelt profile remains mandatory and continues to deny `file-write*` for both the reviewed workspace and the explicit protected code root. `--force`, `--yolo`, `--auto-review`, and `--approve-mcps` remain forbidden.

Probe auditor v2 may change only evaluator interpretation of Cursor's completed Shell event. It must recognize both `result.success` and `result.failure`, retain exact command and event-order checks, and reject every failure result with its real exit code. It must not convert Candidate 09 into a pass or alter any saved historical result.

## Boundary

Seatbelt remains macOS-only evaluation tooling, not a dependency of `fe-code-review`. Candidate 10 makes no Windows or Linux isolation claim. The outer profile protects the evaluated workspace and the configured repository parent directory; it does not claim a whole-machine write-deny policy. Cursor's isolated temporary HOME remains outside both protected roots because authentication and client state require a writable location.

The public and installed Skill must remain unchanged. No source-bearing workspace, external request, login, commit, push, release change, or temporary-data cleanup is authorized by this design freeze.

## Offline Gates

Before any source-free authorization request, Candidate 10 must pass:

1. Runner tests proving `--sandbox disabled`, mandatory outer Seatbelt, forbidden permission flags, exact hashes, output freshness, and unchanged pre/post workspace state.
2. Real local Seatbelt proof that the frozen read-only Git command succeeds while workspace and protected-root writes remain denied.
3. Auditor tests accepting a successful Shell result and rejecting a `result.failure` with its actual command and exit code.
4. Full Vitest, grouped replay, both Candidate Skill validators, Node syntax, JSON parsing, Markdown links, sensitive-identifier scan, Skill hashes, and `git diff --check`.

## Offline Implementation Result

Runner v6 implements the frozen one-argument-pair delta and keeps the outer Seatbelt wrapper plus every runner v5 preflight, postflight, hash, output, warning, and permission-flag gate. Auditor v2 distinguishes `result.success` from `result.failure`; a failed command now retains its actual command and exit code and remains invalid. Targeted tests pass `2 / 2` files and `9 / 9` tests.

The first local Seatbelt invocation ran inside the current Codex sandbox, which prevented the outer `sandbox-exec` process itself from applying a profile. Cursor did not run, no network was accessed, and no model request occurred. This invalid host-context preflight is retained and is not Candidate 10 runtime evidence.

The required host-level proof then ran outside the Codex sandbox against fresh `/private/tmp` workspace and protected-root directories. The frozen Git status command exited `0` with empty stdout/stderr; workspace and protected-root write attempts were denied with no marker files created; and the complete workspace tree remained unchanged. This proves the local outer Seatbelt boundary only. It does not prove real Cursor behavior.

The sanitized [local proof](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-10-local-proof.json) records both contexts, zero Cursor executions, zero external model requests, zero source transmission, and unchanged public and installed Skills.

## Static Closure

Static closure passes `25 / 25` Vitest files and `179 / 179` tests, including the targeted `3 / 3` files and `30 / 30` Candidate 10 tests. Grouped replay passes `7 / 7`; both Candidate Skill validators pass using the existing isolated PyYAML 6.0.3 environment without installation; Candidate 10 Node syntax passes `2 / 2`; JSON parsing passes `140 / 140`; and Markdown local links pass `170 / 170` across 60 repository Markdown files. The targeted sensitive-identifier scan and `git diff --check` pass.

Runner v6 remains SHA-256 `6144c30a7495a6e0f4e52ba0d78745ab35bc8af09f93f2d87a9ab7f7ba7abc10`; auditor v2 remains `1c8003ab5bc6c67c25e518595a8878a205d1e3c45d347244a24312468a821c80`; and the unchanged Seatbelt profile remains `6ed882cbbd2605d3192502484407641d48dd15a1bc0e1b77f0682844d092ed40`. The public and installed Skill remain SHA-256 `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`.

Static closure created no Cursor login, made no external model request, transmitted no source, and changed no public or installed Skill.

## Source-Free Capability Probe Result

After separate authorization, a fresh Candidate 10 build, isolated Cursor HOME, control directory, and source-free Git workspace were created. The workspace contained only Git metadata plus the 12-file public Candidate Skill. Runner v6 executed exactly one outer-Seatbelt-wrapped Plan-mode request with `--sandbox disabled`. The runner exited `0`, emitted zero stderr bytes, and preserved identical pre/post Git-status and complete workspace-tree hashes.

The capability gate still failed. Cursor emitted the exact `/usr/bin/git status --short --untracked-files=all` Shell command, but completed the tool call as `result.rejected` before execution. The rejected payload classified the command as `isReadonly: false` and supplied an empty reason. Command executions therefore remained `0`; no MCP ran; the final assistant message was exactly `PLAN_READ_ONLY_OK`; and the result event matched the ordered assistant aggregate. An exact response and unchanged workspace cannot override a rejected required command.

Auditor v2 returned invalid. It recognizes `result.success` and `result.failure`, but the frozen implementation does not treat `result.rejected` as an execution result, so it also reported result-shape, command, and exit violations. Direct trace inspection confirms the exact command in both the started event and rejected payload. The rejection independently closes the gate; changing only the auditor could not turn zero command executions into a pass.

The sanitized [probe result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-10-probe-result.json) records one external source-free request, zero reviewed or private source transmission, zero retries, zero MCP calls, and an unchanged workspace. No account, login URL, challenge, session, token, or Cursor state-file content is recorded.

Candidate 10 is closed `No-Go`. No source-bearing workspace was prepared or executed, and no retry, replacement, reinterpretation, or mode switch is allowed.

## Post-stop Closure

Post-stop closure passes `25 / 25` Vitest files and `179 / 179` tests, including the targeted `3 / 3` files and `30 / 30` Candidate 10 tests. Grouped replay passes `7 / 7`; both Skill validators pass using the existing isolated PyYAML 6.0.3 environment without installation; Candidate 10 Node syntax passes `2 / 2`; JSON parsing passes `141 / 141`; and Markdown local links pass `171 / 171` across 60 repository Markdown files. The targeted sensitive-identifier scan and `git diff --check` pass.

The source-free workspace remains clean with complete tree SHA-256 `66f2cfad5a7df999c8e43c405d3550e77526f649b20fee6534cdd9f67782d4a4`; its Candidate Skill tree remains `d25f55a5e11dd59c2eb8f16f3d4650924e61d1bee05c6b19b6545c83b61ef18f`. The public and installed Skill remain SHA-256 `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`.

The Candidate 10 window executed one source-free external request, zero source-bearing runs, zero retries, zero replacements, and zero mode switches. No reviewed or private source was transmitted.

## Frozen Source-Free Gate Contract

Before execution, the frozen contract required a fresh isolated Cursor HOME and fresh source-free Git workspace. The single Plan-mode request through runner v6 had to make one successful read-only `/usr/bin/git status --short --untracked-files=all` Shell call, run zero MCP calls, preserve the workspace, emit no runner warning or stderr, and end with exact `PLAN_READ_ONLY_OK`.

The rejected command failed that contract and stopped Candidate 10 without retry, replacement, reinterpretation, or mode switch. No source-bearing request was authorized.

## Next Gate

Candidate 10 remains `No-Go`; do not execute another probe or any source-bearing request. Installation, repository commit, push, release change, and temporary-data cleanup remain unauthorized.

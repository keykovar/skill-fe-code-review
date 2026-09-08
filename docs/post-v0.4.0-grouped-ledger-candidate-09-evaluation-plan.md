# Post-v0.4.0 Grouped Ledger Candidate 09 Evaluation Plan

Status: Candidate 09 `No-Go`; source-free Plan-mode capability probe failed nested sandbox application

Date: 2026-08-28

## Purpose

Candidate 09 is an evaluation-tooling-only successor to Candidate 08. It does not retry, replace, or reinterpret Candidate 08, which remains `No-Go`. The Candidate 08 Skill, mode references, grouped validator, visible output fields, severity rules, recommendation rules, and review scope remain byte-identical.

Candidate 09 addresses two transport and isolation gaps. Cursor's stream-json result event is an ordered aggregation of assistant messages rather than a duplicate of the final assistant message. Separately, Plan mode emitted a Shell policy requesting workspace read-write access, so the client trace alone could not prove strict read-only enforcement.

## Output Contract

The dedicated probe auditor requires the final assistant message to match the expected response SHA-256 exactly. It separately requires the result event to equal the ordered concatenation of all assistant text messages. One optional pre-tool assistant message is allowed, so a valid Cursor aggregate is not misclassified as output drift. Exactly one started and completed Shell call, the frozen command, exit `0`, empty command stdout/stderr, zero MCP calls, correct event order, and an unchanged workspace tree remain mandatory.

The generic runtime auditor's `outside-workspace-read` rule is not used for the explicitly required `/usr/bin/git` executable path. This exception is confined to the dedicated source-free probe auditor and does not weaken source-bearing outside-workspace read checks.

## OS-enforced Read-only Boundary

Runner v5 launches Cursor through `/usr/bin/sandbox-exec` with a frozen Seatbelt profile. The profile allows reads but denies `file-write*` for both the reviewed workspace and an explicit protected code root. Cursor HOME remains isolated outside both paths. `cursor --version` runs with the isolated HOME as cwd rather than the reviewed workspace.

The runner validates its own hash, the Seatbelt profile hash, Git HEAD, branch, status, complete workspace tree, Cursor Skill tree, client version, and Prompt hash before launch. After Cursor exits, it requires the Git status hash and complete workspace tree hash to remain identical. `--auto-review`, `--force`, `--yolo`, and `--approve-mcps` remain forbidden.

Seatbelt is evaluation tooling for the current macOS host, not a runtime dependency of `fe-code-review`. Candidate 09 makes no Windows or Linux isolation claim; those environments remain `Cannot Verify` until an equivalent OS-enforced wrapper is designed and validated.

## Offline Proof

The real local Seatbelt profile allowed reading a public synthetic file while blocking workspace creation and modification and protected-root creation with `Operation not permitted`. Runner v5 then launched a local fake Cursor through the real Seatbelt wrapper: the fake client read the public file, its workspace write attempt was blocked, stderr stayed empty, and pre/post Git status and workspace tree hashes matched.

The dedicated auditor also replayed the frozen Candidate 08 source-free trace and accepted its final assistant plus aggregate result semantics. This is tooling-only replay evidence; it does not change the Candidate 08 decision and is not Candidate 09 runtime evidence.

The sanitized [local proof](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-09-local-proof.json) records zero external model requests, zero source transmission, no Candidate 09 login, and no public or installed Skill change.

## Static Closure

Static closure passes `23 / 23` Vitest files and `169 / 169` tests, including the targeted `3 / 3` files and `28 / 28` Candidate 09 tests. Grouped replay passes `7 / 7`; both Candidate Skill validators pass; Candidate 09 Node syntax passes `2 / 2`; JSON parsing passes `137 / 137`; and Markdown local links pass `168 / 168` across 59 repository Markdown files. The targeted sensitive-identifier scan and `git diff --check` pass.

The public and installed Skill remain SHA-256 `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`. Static closure made no external model request, transmitted no source, created no Candidate 09 login, and changed no release artifact.

## Source-Free Capability Probe Result

After separate authorization, a fresh isolated Cursor HOME and source-free Git workspace executed exactly one Seatbelt-wrapped Plan-mode request. The outer runner exited `0`, emitted zero stderr bytes, and preserved identical Git-status and complete workspace-tree hashes. The trace contained exactly one started and completed Shell call, zero MCP calls, an ordered assistant aggregate, and an exact final `PLAN_READ_ONLY_OK` response.

The capability gate still failed. Cursor requested `TYPE_WORKSPACE_READWRITE` and attempted to initialize its enabled inner sandbox inside the mandatory outer Seatbelt wrapper. That Shell call completed as a failure with exit `71`: `sandbox-exec` could not apply the inner sandbox because the outer Seatbelt denied `sandbox_apply`. The frozen Git status command was exact in the started and completed arguments, but it never completed successfully. An exact final response and unchanged workspace cannot override the failed required command.

The dedicated auditor correctly returned invalid, although its two reported violations require a shape caveat. It reads completed command and exit evidence only from `result.success`, so the real `result.failure` appeared as both `command-mismatch` and `command-exit`. The underlying exit `71` failure independently closes the gate; no auditor relaxation could turn this run into a pass.

The sanitized [probe result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-09-probe-result.json) records one external source-free request, zero reviewed or private source transmission, zero retries, and an unchanged workspace. No account, login URL, challenge, session, token, or Cursor state-file content is recorded.

Candidate 09 is closed `No-Go`. No source-bearing Stage 1 workspace was prepared or executed, and no retry, replacement, reinterpretation, or mode switch is allowed.

## Post-stop Closure

Post-stop closure passes `23 / 23` Vitest files and `169 / 169` tests, including the targeted `3 / 3` files and `28 / 28` Candidate 09 tests. Grouped replay passes `7 / 7`; both Skill validators pass using the existing isolated PyYAML 6.0.3 environment without installation; Candidate 09 Node syntax passes `2 / 2`; JSON parsing passes `138 / 138`; and Markdown local links pass `169 / 169` across 59 repository Markdown files. The targeted sensitive-identifier scan and `git diff --check` pass.

The source-free workspace remains clean with complete tree SHA-256 `66f2cfad5a7df999c8e43c405d3550e77526f649b20fee6534cdd9f67782d4a4`; its Candidate Skill tree remains `d25f55a5e11dd59c2eb8f16f3d4650924e61d1bee05c6b19b6545c83b61ef18f`. The public and installed Skill remain SHA-256 `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`.

The Candidate 09 window executed one source-free external request, zero source-bearing runs, zero retries, zero replacements, and zero mode switches. No reviewed or private source was transmitted.

## Next Gate

Candidate 09 remains `No-Go`; do not execute another probe or any source-bearing request. Installation, repository commit, push, release change, and temporary-data cleanup remain unauthorized.

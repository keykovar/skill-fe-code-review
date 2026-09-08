# Post-v0.4.0 Grouped Ledger Candidate 07 Evaluation Plan

Status: `No-Go`; Stage 1 stopped after `D-ID-001 RUN-01` failed execution and grouped-ledger structure gates

Date: 2026-08-28

## Purpose

Candidate 07 is a new runtime window, not a retry of Candidate 06. Candidate 06 remains `No-Go` because its single authorized isolated Cursor login exited before any source-free request. The user's later report that browser login completed is retained as an observation only: the Candidate 06 CLI process had already exited, so that report cannot replace the missing client trace or become runtime evidence.

Candidate 07 changes no Skill instruction, reference, adapter, validator, visible output field, evaluator mode, or source policy. It uses the byte-identical Candidate 06 Skill tree SHA-256 `49fd77c07ccb214b4fe464b5019888ac496ca59fd52ba3c04cf8390e8627211d` and v3 runner SHA-256 `067b4a9d25a44a062bed5a25a44266c4001949fe30211be583fc116cb6715e07`.

Candidate 07 is now closed `No-Go`. Its successful source-free probe remains a historical precondition only and does not override the first source-bearing run's execution and structural failures.

## Offline Freeze

The thin Candidate 07 preparer reuses the immutable Candidate 06 preparation engine without modifying its recorded hash. It created seven fresh public-synthetic workspaces under `/private/tmp/post-v0.4.0-grouped-ledger-candidate-07-offline-freeze-01`.

All declared fixture tests matched their expected exits `7 / 7`; Q-ID-001 and F-ID-001 repeat pairs are byte-identical `2 / 2`; a separate tree pass keeps all workspaces unchanged `7 / 7`. The sanitized freeze record is `evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-07-offline-freeze.json`, SHA-256 `d20c6c89a84f8411cee3c9ccf44f8d3f992cc61dca613fb49731840365d67be8`.

Static closure passes `18 / 18` Vitest files and `154 / 154` tests, grouped replay `7 / 7`, both Skill validators through the existing isolated PyYAML 6.0.3 environment without installation, Candidate 07 Node syntax `1 / 1`, JSON parsing `131 / 131`, Markdown local links `164 / 164` across 57 repository Markdown files, the targeted sensitive-identifier scan, and `git diff --check`. The public and installed Skill remain SHA-256 `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`. Offline preparation made no model request or source transmission.

## Source-Free Gate

Candidate 07 requires a fresh isolated HOME and a new Cursor login flow. Browser account state may make the login faster, but Candidate 06 credentials, state, trace, or result cannot be carried forward.

After separate authorization, the fresh isolated login succeeded without retry and the probe sent only this source-free prompt:

```text
Return exactly CLIENT_ISOLATION_OK and nothing else. Do not use tools.
```

The probe passed: process exit `0`, exactly one decoded assistant response equal to `CLIENT_ISOLATION_OK`, zero tools, commands, MCP calls, retries, permission fallbacks, capability warnings, forbidden endpoint signals, source transmission, or workspace entries. Stderr was empty, and the seven frozen workspace trees remained unchanged `7 / 7`. The sanitized result is `evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-07-probe-result.json`, SHA-256 `ead93bdb746b0f99348baea4b4bde2ce60abd1eaf1f10a2c8107a34a91a844d5`.

## Source-Bearing Stage 1 Result

After separate authorization, `D-ID-001 RUN-01` passed every atomic preflight check and sent one frozen 31-file public-synthetic workspace for Deep Review. The Cursor process exited `0` with empty stderr, made one external model request, transmitted no private source, and left the reviewed workspace plus all seven frozen workspace trees unchanged.

The run failed two independent promotion gates:

1. Cursor Ask mode denied the single read-only Git inventory Shell command. The declared `node --test` execution therefore never started: expected calls `1`, observed calls `0`.
2. The final response identified the correct Finding but failed the frozen grouped-ledger structure: 16 validator errors across `coverage-ledger-missing-before-after` and `coverage-ledger-missing-disposition`.

The semantic result is retained only as an unscored observation. It found `F-001` (`stale-profile-token-after-logout`), assigned `Blocking`, selected `Simplify`, and concluded `修改后可以进入下一步`. Correct semantics do not override the execution or structural failures.

The sanitized [Stage 1 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-07-stage-1-result.json), SHA-256 `41b6c05de05da0e488e777234d5011910aa9216358b320d3c9fa094ada8622be`, records the transfer boundary, preflight, client contract, execution audit, unscored semantic observation, structural errors, artifact hashes, and integrity result without account, session, request, credential, or raw-trace content.

No retry, replacement, reinterpretation, or mode switch occurred. `Q-ID-001 RUN-01`, `Q-ID-001 RUN-02`, and all four Stage 2 runs were not executed and are not authorized.

## Post-Stop Closure

Post-stop closure passes `18 / 18` Vitest files and `154 / 154` tests, grouped replay `7 / 7`, both Skill validators using the existing isolated PyYAML 6.0.3 environment without installation, Candidate 07 Node syntax `1 / 1`, JSON parsing `132 / 132`, Markdown local links `165 / 165` across 57 repository Markdown files, the targeted sensitive-identifier scan, and `git diff --check`. All seven prepared workspace trees remain unchanged; the public and installed Skill remain SHA-256 `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`.

The Candidate 07 runtime window made two external model requests: one source-free probe and one public-synthetic source-bearing Deep Review. It transmitted no private source. Temporary Candidate 07 login, cache, workspace, trace, and evaluation artifacts remain retained until separately authorized cleanup.

## Next Gate

Candidate 07 is closed `No-Go`. Do not retry or reinterpret `D-ID-001 RUN-01`, and do not execute any remaining Candidate 07 source-bearing request. A future candidate requires a newly frozen client/execution and rendering contract, fresh workspaces, a fresh source-free probe, and separate source-bearing authorization. Private source remains forbidden.

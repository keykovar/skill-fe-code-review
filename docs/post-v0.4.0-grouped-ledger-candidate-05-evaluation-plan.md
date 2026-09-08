# Post-v0.4.0 Grouped Ledger Candidate 05 Evaluation Plan

Status: `No-Go`; the first authorized source-bearing run stopped on a client-contract failure before promotion scoring

Date: 2026-08-28

## Purpose

Candidate 05 is a new evaluation window. It does not retry or reinterpret Candidate 04, which remains `No-Go` after evaluator preflight replaced zsh `PATH` before Cursor started. Candidate 05 keeps the grouped-ledger runtime Skill, mode references, prompts, fixtures, semantic oracles, and promotion thresholds byte-identical to Candidate 04. Its only behavioral delta is evaluator tooling before client start.

The stable public and installed Skill remain v0.4.0 at SHA-256 `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`. The public review-output validator remains `8ca475ad2c6d9184a19716bbad76b483a00c9a6ac85c591088431ef61771ccf3`.

## Candidate Boundary

The prospective runtime hashes remain:

| Artifact | SHA-256 |
| --- | --- |
| `SKILL.md` | `a8b81157abe92c944143a28386ffd9f86c25711ee7ab40d17e2ea0b6a514cb7e` |
| Quick reference | `91fe031195f6018ecbf29c48aab5fc26477f9262b40eb7dd4d149b2294c7a9ed` |
| Deep reference | `44d1fb20cfc2f3b9814943d5254e2349387a8b17832eab27b618a2a2a3bedc36` |
| Fix reference | `8380289a00f3c2f1a1ea740bc824b1a53813d6839b3957cae3c54c0e27757d33` |
| Prospective review-output validator | `0293481ada8e2c722730f02f2663244d3c446e4d0a46dd9c9bc63ed030e81b8f` |

No problem-origin, occurrence-characteristic, evidence-status, Risk-decision, severity, recommendation, mode, adapter, collector, Context7, Playwright, Fix Review, or private-source behavior change belongs to Candidate 05.

## Atomic Node Preflight

All Candidate 05 Cursor probes and reviews must run through `scripts/run-cursor-evaluation-v2.mjs` at SHA-256 `8d45c08beef54a86220ff7f995c3a2b8c88bbafa38382a9339d06137bb31e322`. The retained literal-argv runner remains byte-identical at `43e7c69ed17622c6ca449b071c54792036e8bc8ad8f1b210e938d76241e0d05e`.

Runner v2 performs these checks inside one Node process before the client review call:

1. Require absolute executable paths for Git and Cursor.
2. Verify the v2 runner SHA-256.
3. Verify Git HEAD, branch, and exact status SHA-256.
4. Verify the complete workspace tree excluding `.git`.
5. Verify the installed Cursor Skill tree.
6. Verify the exact Cursor version.
7. Delegate Prompt SHA-256, isolated HOME, and fresh output-path checks to the retained literal runner in the same process.
8. Invoke Cursor with `shell: false` and the complete Prompt as one final argv value.

Ad hoc shell preflight is forbidden. The v2 regression test intentionally sets `PATH` to an unusable directory while passing absolute Git and fake-Cursor executables; the full preflight and literal transport still pass. Runner-hash and Git-status drift tests fail before the client review executes. The old and new runner suites pass `6 / 6`, and the Candidate 05 preparer test passes `1 / 1` without a network request.

## Offline Freeze

Seven new public synthetic workspaces and seven Prompt files were generated under `/private/tmp/post-v0.4.0-grouped-ledger-candidate-05-offline-freeze-01`. Expected deterministic test results match `7 / 7`; Q-ID-001 and F-ID-001 repeat pairs match by HEAD, Prompt SHA-256, and complete workspace tree SHA-256.

Each run freezes its absolute Git executable, client version, HEAD, branch, status SHA-256, Prompt SHA-256, workspace tree, and Cursor Skill tree. No Candidate 04 source-free or source-bearing result is carried forward. The machine-readable [offline freeze](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-05-offline-freeze.json) has SHA-256 `85eeebc1da772712f6a5bd52f74e1f1d9001ffba5741a50f00dbe68fd1277a0a`.

No Cursor login, model request, source-free probe, source-bearing review, source transmission, or public Skill application occurred.

## Final Static Validation

The repository gate passes `14 / 14` Vitest files and `141 / 141` tests, grouped-ledger replay `7 / 7`, both Skill validators with isolated PyYAML 6.0.3, affected Node syntax `3 / 3`, JSON parsing `124 / 124`, and `162 / 162` local Markdown links across 55 repository Markdown files. The targeted sensitive-identifier scan and `git diff --check` also pass.

The stable repository and installed Skill remain SHA-256 `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`; the stable public output validator remains `8ca475ad2c6d9184a19716bbad76b483a00c9a6ac85c591088431ef61771ccf3`. Runner v2, the retained literal runner, and the offline-freeze record also retain their frozen hashes. This gate made no external model request, transmitted no source, created no Cursor login, and did not apply the candidate runtime files to the public or installed Skill.

## Runtime Window

A new separately authorized source-free isolation probe is required. Candidate 04's historical probe cannot be reused. A passing probe must return exact `CLIENT_ISOLATION_OK` with zero tools, MCP calls, commands, retries, endpoint violations, workspace changes, or Prompt drift. It provides no model-quality evidence and authorizes no source-bearing request.

The probe must use a new isolated HOME at `/private/tmp/post-v0.4.0-grouped-ledger-candidate-05-cursor-home-01` and a new Git workspace at `/private/tmp/post-v0.4.0-grouped-ledger-candidate-05-source-free-probe-01`. The workspace may contain only Git metadata and the public Candidate 05 Cursor Skill required by runner v2 preflight; it must contain no fixture, project, private, customer, or production source. The only explicit Prompt sent to Cursor is `Return exactly CLIENT_ISOLATION_OK and nothing else. Do not use tools.\n` at SHA-256 `95cb2fe6e0fd8c835d1e0b5af232f97e6b5e22f3d1455eca2dbeaf6149d52c49`. Any automatic Skill read, tool call, command, MCP call, retry, output mismatch, unexpected endpoint signal, workspace mutation, or hash drift stops Candidate 05 without retry or replacement.

The separately authorized probe passed. Runner v2 verified every frozen preflight input before client start; Cursor returned exact `CLIENT_ISOLATION_OK` in one assistant event and one result event with zero tools, MCP calls, commands, retries, unexpected endpoint signals, stderr, or workspace drift. All seven prepared source-bearing workspaces remained unchanged. The initial trace auditor passed its existing safety checks but did not extract responses from Cursor's `assistant/result` schema, so a supplemental structured parser independently verified both exact response fields. The sanitized [probe result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-05-probe-result.json) records this boundary without account, session, request, credential, or raw-trace data.

The repository trace auditor now deterministically extracts Cursor `assistant/result` responses and usage while retaining the existing Codex event schema. A new optional expected-response SHA-256 gate validates exact content without emitting the response body. The retained source-free trace replay passed with response SHA-256 `08d172bf341a620dbf1b9e55887d785beb2d93f92c73a17728f97012e1ef62ba`, one assistant event, one matching non-error result event, the recorded token usage, zero violations, and unchanged workspace status. This evaluator-only hardening made no model request and did not alter the Candidate 05 runtime Skill or frozen workspaces.

The separately authorized `D-ID-001 RUN-01` passed every atomic Node preflight check and sent only the frozen 31-file public synthetic workspace. Cursor then reported that `--auto-review` was unavailable because the session lacked a classifier-capable model and team permission, and fell back to `Allowlist`. The effective client mode therefore differed from the frozen `autoReview: true` contract. Candidate 05 stopped `No-Go` at that earliest client-contract failure without retry, replacement, reinterpretation, or mode switch. The sanitized [Stage 1 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-05-stage-1-result.json) records the request, safety, integrity, token, and artifact-hash boundaries without account, session, request, credential, or raw-trace data.

The single run made one external model request and transmitted no private source. Its local execution audit passed: 18 read-only tool calls, zero collectors as required for Deep, exactly one `node --test`, zero MCP calls, zero writes, zero auditor violations, and unchanged hashes across all seven frozen workspaces. The unscored final report found the expected stale-profile-token regression, selected `Simplify`, and recommended not proceeding. It also failed the candidate grouped-ledger structural validator because bold-wrapped group headers and Finding rows did not match the frozen canonical grammar. That diagnostic does not override or reinterpret the earlier client-contract failure.

The remaining Stage 1 runs were not executed:

1. `Q-ID-001 RUN-01`
2. `Q-ID-001 RUN-02`

Stage 2 was not authorized:

1. `Q-ID-002 RUN-01`
2. `F-ID-001 RUN-01`
3. `F-ID-001 RUN-02`
4. `K-ID-001 RUN-01`

No further Candidate 05 source-bearing request is authorized. Private source remains forbidden.

## Stop Rule

Stop at the first preflight, Prompt-integrity, transfer-scope, semantic, structural, severity, recommendation, collector, read-only, isolation, integrity, hash, budget, fixture, replay, or client-contract failure. Do not retry, replace, reinterpret, change mode, or relax a gate.

## Next Gate

Candidate 05 is closed `No-Go`. Do not retry or reinterpret `D-ID-001 RUN-01`. Any future candidate requires a newly frozen client contract, fresh workspaces, a fresh source-free probe, and separate source-bearing authorization.

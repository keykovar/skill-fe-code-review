# Post-v0.4.0 Ledger Completeness Candidate 02 Evaluation Plan

Status: `No-Go`; Stage 1 stopped after `Q-ID-001 RUN-01`; Stage 2 not run

## Evidence And Problem

The stable v0.4.0 Cursor default print-mode sample found all three `Q-ID-001` concepts but failed structural validation because a repeated Finding ID did not carry the required merge basis on every matching ledger entry.

Candidate 01 made final repeated-ID reconciliation mechanical. Its first frozen source-bearing run passed execution, isolation, and integrity gates but recalled only `2 / 3` expected Findings and never exercised a repeated ID. The tracked import of an untracked dependency was omitted even though the collector exposed both the import patch and the untracked file.

The next candidate must address both properties together:

1. Preserve complete discovery of directly affected contracts before prioritization.
2. Reconcile repeated ledger IDs without changing the public output schema.

## Decision

Candidate 02 is a Prompt-only Skill candidate. It does not introduce an orchestrator.

An output validator can detect malformed headings, IDs, ledger syntax, and read-only trace violations. Without a predeclared semantic oracle, it cannot know which real defect the model omitted. A validator-driven second model round would therefore add runtime, token, platform, and privacy complexity without mechanically solving the Candidate 01 recall failure. It would also conflict with chat-only output on clients that cannot intercept the final response consistently.

The orchestrator option remains deferred until repeated evidence shows a failure that deterministic validation can identify and a cross-client interception contract is available.

## Frozen Candidate Boundary

Candidate 02 may change only `skills/fe-code-review/SKILL.md` and its direct deterministic content assertions.

The implementation may make two narrow instruction changes:

1. Before prioritization, require the internal affected-contract ledger to account for directly affected dependency/import resolution, input or parameter contracts, conditions or control flow, state writes, and return or output contracts. Every in-scope entry must resolve to behavior-preserving, an evidence gap, or a Finding.
2. Before responding, mechanically group visible ledger entries by final Finding ID. Repeated IDs must carry the same non-empty semantic merge key on every matching entry; single IDs carry none.

The implementation must replace or extend existing sentences rather than create another output section or duplicate the same invariant in mode references. Net growth in `SKILL.md` must not exceed 60 English words relative to the stable hash. Quick, Deep, and Fix reference hashes must remain unchanged.

## Preserved Contracts

- Quick, Deep, and Fix remain read-only and chat-only by default.
- Quick and Deep retain their current localized headings, visible ledger, severity, Finding-ID, and recommendation contracts.
- Fix preserves previous IDs and does not expand into Deep Review.
- Referenced untracked files remain submit-blocking.
- `Cannot Verify`, Context7, Playwright, minimal sufficient design, and external-source authorization rules remain unchanged.
- No rule moves from the core Skill into a conditional reference.
- No adapter, collector, fixture, validator, output example, or runtime script changes during this candidate.
- No automatic repair round, second model, subagent, MCP call, output file, hosted service, or mandatory JSON output.

## Static Gates

Before any runtime request:

- Record exact candidate hashes and English-word deltas against the stable baseline.
- Pass `pnpm test`, both Skill validators, Node syntax checks, all tracked JSON parsing, and `git diff --check`.
- Confirm the three mode reference hashes remain byte-identical.
- Prepare fresh isolated public synthetic workspaces from the frozen fixture definitions.
- Confirm expected fixture test behavior, Git status, and complete relevant file hashes.

Candidate implementation passed the static gate on 2026-08-27:

- `SKILL.md` SHA-256: `53c0d87668f2fe07e8cc69ebabf6dab37c9f1be4d2a01fb3daf542a9e7148eb0`.
- Net `SKILL.md` growth: `28 / 60` English words; baseline `3766`, candidate `3794`.
- Quick, Deep, and Fix reference hashes remained byte-identical to the frozen baseline.
- Vitest passed `9 / 9` files and `111 / 111` tests.
- Both Skill validators, four Node syntax checks, `44 / 44` tracked JSON parses, and `git diff --check` passed.
- No fixture workspace, source-free probe, model call, or source-bearing request was executed.

Seven fresh public synthetic workspaces were then prepared in the frozen order. All `7 / 7` expected test exits, `14 / 14` Agent/Cursor Skill copies, `7 / 7` adapter copies, candidate hashes, Git states, and complete path-plus-content tree hashes matched. The `Q-ID-001` and `F-ID-001` repeat pairs are byte-identical within each pair.

The client is frozen as Cursor Agent CLI `2026.08.11-e8db854`, default print mode with Smart Auto review, Auto model, stream-JSON output, sandbox enabled, file-backed credential storage, and a dedicated HOME. The first authorized login used the macOS default credential store and failed after browser authorization because replacing `HOME` removed the default keychain path (`Failed to store authentication tokens`; `SecItemCopyMatching -50`). It executed no probe or source-bearing request. The corrected login and every frozen Cursor command set `AGENT_CLI_CREDENTIAL_STORE=file`, matching the previously verified isolated-HOME procedure. The corrected login succeeded.

The separately authorized source-free probe then passed once with exact `CLIENT_ISOLATION_OK`: process exit `0`, 33 seconds elapsed, one assistant message, seven trace events, zero tools, MCP calls, commands, retries, endpoint signals, or stderr, and a valid trace audit. The empty probe workspace and all seven frozen fixture trees remained unchanged. This is an isolation precondition only and does not authorize either Stage 1 source-bearing run. See the [probe result](../evaluation/runtime-windows/post-v0.4.0-ledger-completeness-candidate-02-probe-result.json).

## Runtime Window

Run one source-free isolation probe before any source-bearing request. Freeze the client version, mode, prompt, Skill hash, fixture hashes, trace policy, and zero-retry policy before the probe. A passing probe is only a client-isolation precondition and authorizes no source transfer.

### Stage 1

Execute two fresh byte-identical `Q-ID-001` Quick runs in frozen order. Obtain separate authorization before each external source-bearing request. Both runs must independently pass every gate:

- `3 / 3` required-finding recall, including the referenced-untracked dependency.
- `F-001` referenced-untracked file, `F-002` removed slash normalization, and `F-003` ignored base URL contract.
- Stable concept-to-ID mapping across the unchanged pair.
- Valid coverage-ledger `before -> after` entries.
- Valid repeated-ID merge keys whenever an ID appears more than once.
- Supported severity, Blocking outcome, design decision, localized conclusion, and recommendation.
- Exactly one context collector call and one declared deterministic test execution.
- Zero equivalent Git rereads, retries, MCP calls, oracle reads, outside-workspace reads, or writes.
- Unchanged Git status and frozen file hashes.

Any Stage 1 failure stops Candidate 02 at `No-Go`. Do not retry, replace, reinterpret, or switch client mode after observing the result.

### Stage 2

Stage 2 is authorized only after Stage 1 passes `2 / 2`. It reuses the frozen v0.4.0 public synthetic matrix for one independent Quick case, one Deep case, the byte-identical Fix pair, and one no-clear-issue Quick control. All five runs must pass their existing semantic, structural, severity, closure, scope, read-only, isolation, and integrity gates without retry.

Stage 1 and Stage 2 form one seven-run candidate window. Promotion requires `7 / 7`; aggregate scoring cannot compensate for a failed mandatory gate.

## Efficiency Evidence

Record elapsed time, tool calls, uncached input, cached input, and output tokens for every run. These observations are not Skill-only quality metrics because provider and client caching vary. Deterministic efficiency gates are the 60-word instruction budget, unchanged mode references, no added output section, no extra test execution, no retry, and no second model round.

## Promotion Rule

Candidate 02 is eligible for implementation only within this frozen boundary. It is eligible for promotion only after all static gates, the source-free precondition, and all seven source-bearing runs pass against one exact candidate.

Candidate 01 remains retained `No-Go` evidence. No Candidate 01 output, probe, or source-bearing result carries into Candidate 02.

## Recorded Result

The separately authorized public synthetic `Q-ID-001 RUN-01` passed execution, trace, read-only, integrity, and the complete `3 / 3` semantic oracle. It emitted `F-001` referenced-untracked-file as Blocking, `F-002` removed-slash-normalization as Blocking, and `F-003` ignored-base-url-contract as Risk, with the expected IDs, `Simplify` decision, and `修改后提交` recommendation.

The mandatory output structure still failed. `F-003` appeared in two coverage-ledger entries, but only the second carried `合并依据：base-url-contract`. The first omitted the merge key. The validator therefore returned `coverage-ledger-repeated-finding-id-merge-key-missing` for lines 21 and 22.

The frozen stop rule was applied immediately. `Q-ID-001 RUN-02` and all five Stage 2 runs were not executed; no retry, replacement, reinterpretation, or mode switch occurred. Candidate 02 is retained as `No-Go`. See [Candidate 02 Results](evaluation-results/post-v0.4.0-ledger-completeness-candidate-02.md) and the [machine result](../evaluation/runtime-windows/post-v0.4.0-ledger-completeness-candidate-02-stage-1-results.json).

The Candidate 02 runtime-instruction delta was then removed. The repository Skill and installed symlink resolve to the stable v0.4.0 SHA-256 `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`, while the candidate evidence remains retained. Result-record closure validation passed `9 / 9` Vitest files and `111 / 111` tests, both Skill validators, `4 / 4` Node syntax checks, `46 / 46` JSON parses, and `git diff --check`, with no additional model or network request.

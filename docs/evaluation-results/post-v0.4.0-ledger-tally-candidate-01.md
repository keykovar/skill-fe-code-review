# Post-v0.4.0 Ledger Tally Candidate 01 Results

Evaluation date: 2026-08-26

Status: `No-Go`

## Objective

Candidate 01 tested whether a mechanical final ledger tally could make every repeated Finding ID carry the same non-empty merge key without changing the public review format.

The candidate changed only the final Finding reconciliation instructions and their deterministic content assertions. It did not change review modes, read-only behavior, adapters, fixtures, or evaluator scripts.

## Frozen Candidate

| Item | Value |
| --- | --- |
| Candidate Skill SHA-256 | `696d0e3ef9aef56625602022c85ef9c92f3244ca8c38e20f96351dcfdc282c4f` |
| Stable Skill SHA-256 | `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286` |
| Source-bearing case | Public synthetic `Q-ID-001` URL regression |
| Client mode | Cursor default print mode |
| Retry or replacement | None |

Static validation passed before runtime evaluation: `9 / 9` Vitest files and `110 / 110` tests, both Skill validators, Node syntax, all tracked JSON parsing, and `git diff --check`.

## Runtime Results

The source-free isolation probe passed before the source-bearing run. It authorized no private source transfer; the runtime case used only the checked-in public synthetic fixture.

The one frozen source-bearing run exited successfully in 75 seconds and preserved repository integrity. The trace auditor accepted exactly one context collector call, one deterministic `node --test` execution, zero equivalent Git inventory rereads, zero MCP calls, zero outside-workspace reads, and zero write operations. Git status and all `30 / 30` frozen file hashes remained unchanged.

The semantic oracle failed:

- The review emitted the slash-normalization regression and ignored-parameter contract as two independent Findings.
- It omitted the submit-blocking tracked import of the untracked `src/request-config.ts` module.
- Required-finding recall was therefore `2 / 3`.
- No Finding ID was repeated, so the candidate's repeated-ID target was not exercised.

The deterministic output validator also failed with one unsupported Blocking-outcome label and two coverage-ledger entries that did not use the required explicit `before -> after` form.

## Decision

Candidate 01 is `No-Go`. A structural finalization clarification cannot be promoted when the same run loses a required Blocking Finding, even though its execution, isolation, and read-only gates pass.

The failed run is not retried or replaced. The candidate changes were removed and the stable Skill restored without adding traces, credentials, provider details, or temporary paths to the repository. After the sanitized result was retained and separate deletion authorization was granted, all four Candidate 01 probe, source-bearing workspace, and evidence items under the frozen `/private/tmp` prefix were deleted; the remaining-prefix count is zero.

This single run does not prove that the tally instruction caused the semantic omission. It does prove that the exact candidate failed its frozen acceptance gate and cannot be selected.

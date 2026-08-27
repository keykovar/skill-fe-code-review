# Post-v0.4.0 Ledger Completeness Candidate 02 Results

Evaluation date: 2026-08-27

Status: `No-Go`

## Objective

Candidate 02 tested whether a narrow Prompt-only change could preserve complete affected-contract discovery and make every visible ledger entry sharing a Finding ID carry the same non-empty merge key.

The candidate added `28 / 60` allowed English words to `SKILL.md`. Quick, Deep, and Fix references, adapters, collectors, fixtures, validators, output sections, read-only behavior, and Fix boundaries remained unchanged. It introduced no orchestrator, retry, second model round, or private-source transfer.

## Static And Isolation Gates

The exact candidate Skill SHA-256 was `53c0d87668f2fe07e8cc69ebabf6dab37c9f1be4d2a01fb3daf542a9e7148eb0`. Static validation passed `9 / 9` Vitest files and `111 / 111` tests, both Skill validators, four Node syntax checks, `44 / 44` tracked JSON parses, and `git diff --check`.

All seven public synthetic workspaces passed their frozen fixture, candidate-copy, adapter, Git-state, repeat-pair, and tree-integrity checks. The isolated Cursor source-free probe returned exact `CLIENT_ISOLATION_OK` with zero tools, MCP calls, commands, retries, endpoint signals, stderr, or workspace changes.

## Stage 1 Result

Only the separately authorized public synthetic `Q-ID-001 RUN-01` was executed. It completed in 95 seconds with exit code `0`. The trace contained 110 events and 12 tool calls. It used the context collector exactly once, executed the declared `node --test` exactly once, performed no equivalent Git inventory reread, used no MCP tool, produced no auditor violation or stderr, and left Git status plus all `30 / 30` frozen file hashes unchanged.

The semantic oracle passed completely:

- `F-001` referenced-untracked-file: `Blocking`.
- `F-002` removed-slash-normalization: `Blocking`.
- `F-003` ignored-base-url-contract: `Risk`.
- Finding order, `Simplify`, and `修改后提交` matched the frozen contract.

The deterministic output validator failed one mandatory structural rule. The two coverage-ledger entries referencing `F-003` were not mechanically grouped: the first entry omitted `合并依据`, while the second used `合并依据：base-url-contract`. Every visible entry sharing one Finding ID had to carry the same non-empty key.

Observed token values were 62,833 input, 58,496 cached input, 4,337 uncached input, and 4,673 output. These are client/model observations for one run, not a Skill-only benchmark.

## Failure Analysis

This was not an evidence-access or semantic-discovery failure. The review read the required changed files, baseline, caller, and test, then found and classified all three expected issues correctly.

It was a final ledger-render reconciliation failure. The same output applied `slash-join` consistently to all three `F-002` entries, proving that the repeated-ID rule and merge-key syntax were understood. It then applied `base-url-contract` only to the later `F-003` entry. The word `Mechanically` still described a model instruction; it did not create a deterministic post-render operation.

One run is insufficient to prove a systematic model limitation or to attribute causality to one sentence. The bounded conclusion is only that this exact Prompt-only candidate did not make the target invariant reliable enough for promotion.

## Decision

Candidate 02 is `No-Go`. Semantic recall improved to `3 / 3`, but the exact behavior targeted by the candidate still failed its frozen structural gate.

The Stage 1 stop rule was applied immediately. `Q-ID-001 RUN-02` and every Stage 2 run were not executed. There is no retry, replacement, reinterpretation, mode switch, or favorable-sample selection.

After the decision, the two Candidate 02 runtime-instruction changes and their direct content assertions were removed. The repository Skill and its installed symlink now resolve to the stable v0.4.0 SHA-256 `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`; the candidate plan, probe, result, and documentation remain retained as evidence.

The result does not prove that Prompt-only reconciliation can never work. It proves that this exact wording is insufficiently reliable for promotion. Before freezing another candidate, diagnose why the model applied `slash-join` consistently to all repeated `F-002` entries but applied `base-url-contract` to only one of the two repeated `F-003` entries. Do not modify the stable release or start Candidate 03 from this one sample alone.

After recording the result and restoring the stable Skill, local closure validation passed `9 / 9` Vitest files and `111 / 111` tests, both Skill validators, all `4 / 4` Node syntax checks, `46 / 46` JSON parses, and `git diff --check`. No additional model or network request was made.

After separate deletion authorization, all 11 Candidate 02 temporary Cursor credential, probe, evidence, and prepared-workspace items under the frozen `/private/tmp` prefix were deleted; the remaining-prefix count is zero and the sanitized repository evidence remains retained.

Machine-readable evidence is recorded in [`post-v0.4.0-ledger-completeness-candidate-02-stage-1-results.json`](../../evaluation/runtime-windows/post-v0.4.0-ledger-completeness-candidate-02-stage-1-results.json).

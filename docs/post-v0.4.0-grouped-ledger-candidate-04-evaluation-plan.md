# Post-v0.4.0 Grouped Ledger Candidate 04 Evaluation Plan

Status: `No-Go`; the first authorized Stage 1 attempt stopped in evaluator preflight before Cursor started or source was transmitted

Date: 2026-08-27

## Purpose

Candidate 04 is a new evaluation window for the Finding-grouped Changed-Condition Coverage design. It does not retry, replace, or reinterpret Candidate 03. Candidate 03 remains `No-Go` because its first source-bearing command changed the frozen Prompt and expanded the authorized transfer scope before Cursor started.

Candidate 04 keeps the Candidate 03 runtime Skill delta and grouped output grammar byte-identical. Its pre-runtime evaluator changes are a deterministic Cursor launcher that passes the frozen Prompt as one literal argument without a shell and a mode-correct evidence contract: Deep uses normal read-only `main...HEAD` Git evidence, while Quick and Fix use the existing collector exactly once.

The stable public Skill, Quick/Deep/Fix references, installed Skill, and public review-output validator remain at v0.4.0 while this plan is prepared.

## Evidence

- Candidate 03 local closure passed `127 / 127` tests and saved replay `7 / 7` before its runtime window.
- Its isolated source-free probe passed with zero tools, MCP calls, retries, source transfer, or workspace changes.
- `D-ID-001 RUN-01` failed Prompt integrity before promotion scoring: expected 549 characters became 52,484 characters after shell expansion.
- The returned review had the expected Finding and a structurally valid grouped ledger, but that observation cannot promote Candidate 03 because the request boundary was invalid.
- The retained grouped-ledger evaluator now requires concrete `[file:line]` children and remains disconnected from the stable public validator.
- Candidate 03's Deep Prompt required `collect-review-context.mjs --workspace "$PWD" --base main`, but the stable collector supports only `[--workspace <directory>]`; that command would fail before review even with literal Prompt transport.
- Existing successful `D-ID-001` evidence records `collectorRequired: false` and `collectorCalls: 0`, so Candidate 04 corrects the evaluator Prompt rather than changing the Skill or collector.

## Frozen Candidate Boundary

Candidate 04 may later apply only the exact Candidate 03 prospective runtime hashes:

| Artifact | Candidate 04 prospective SHA-256 | Boundary |
| --- | --- | --- |
| `skills/fe-code-review/SKILL.md` | `a8b81157abe92c944143a28386ffd9f86c25711ee7ab40d17e2ea0b6a514cb7e` | Finding finalization step 5 only |
| Quick reference | `91fe031195f6018ecbf29c48aab5fc26477f9262b40eb7dd4d149b2294c7a9ed` | grouped ledger rendering and template only |
| Deep reference | `44d1fb20cfc2f3b9814943d5254e2349387a8b17832eab27b618a2a2a3bedc36` | grouped ledger rendering and template only |
| Fix reference | `8380289a00f3c2f1a1ea740bc824b1a53813d6839b3957cae3c54c0e27757d33` | unchanged from v0.4.0 |
| Prospective public output validator | `0293481ada8e2c722730f02f2663244d3c446e4d0a46dd9c9bc63ed030e81b8f` | grouped Quick/Deep grammar only |
| Retained grouped validator | `a0e429e9ea53dc94ff75d8e573b670e1cdcf30012d07ff31210a968515342998` | evaluator structure only |

No problem-origin, occurrence-characteristic, evidence-status, Risk-decision, severity, recommendation, mode, adapter, collector implementation, trace-auditor, Context7, Playwright, or Fix Review behavior change belongs to Candidate 04.

## Evaluator Evidence Contract

- `D-ID-001` Deep Review must not invoke the context collector. It may use necessary read-only Git commands to inspect `main...HEAD`, the current branch, and workspace state. Its expected collector count is `0`.
- Quick and Fix runs must invoke exactly once: `node .cursor/skills/fe-code-review/scripts/collect-review-context.mjs --workspace "$PWD"`.
- The Quick/Fix collector output replaces separate status, unstaged/staged diff, untracked-file, diff-check, HEAD, and repository-root inventory reads. Equivalent rereads remain forbidden.
- All modes execute `node --test` once, remain read-only, stay inside the public synthetic workspace, and stop without retry after a command failure or denial.

This is an evaluator-contract correction. It does not change Candidate 04 runtime Skill bytes, public behavior, collector implementation, semantic oracle, or promotion threshold.

## Literal Prompt Transport

All Candidate 04 Cursor probes and reviews must run through `scripts/run-cursor-evaluation.mjs` at frozen SHA-256 `43e7c69ed17622c6ca449b071c54792036e8bc8ad8f1b210e938d76241e0d05e`.

The launcher must:

1. Read the Prompt from an evaluator-owned file outside the reviewed workspace.
2. Verify the exact lowercase SHA-256 before starting Cursor.
3. Invoke the absolute Cursor executable with `spawnSync(executable, argv, { shell: false })`.
4. Pass the complete Prompt as exactly one final argv value.
5. Fix the Cursor arguments to print mode, `stream-json`, auto review, enabled sandbox, trusted isolated workspace, and file-backed credential storage.
6. Require the isolated HOME, trace output, stderr output, and Prompt file to remain outside the reviewed workspace.
7. Refuse to overwrite trace or stderr artifacts so a run cannot silently replace prior evidence.
8. Stop the client after 15 minutes and retain any stdout or stderr produced before a spawn failure or timeout.

Do not construct an equivalent shell command, use `eval`, interpolate a Prompt into command text, or pipe a Prompt through a shell. The argv captured by the runner summary, the Prompt file hash, and the decoded client request must agree before semantic scoring.

The runner's isolated fake-client tests pass `3 / 3` at test SHA-256 `c1697f5e954cd7cefb4c959d5916e1746e8d1bab3207a722b74e2b39c0eb4622`. They prove literal argv transport, fail-before-spawn Prompt hash enforcement, evaluator-artifact isolation, and the optional package-script `--` separator. They do not call Cursor, use a network, send source, or prove model behavior.

The initial stable-plan closure passed `11 / 11` Vitest files and `131 / 131` tests, both Skill validators with cached PyYAML 6.0.3 through process-local `PYTHONPATH`, Node syntax, `118 / 118` JSON parsing, the targeted sensitive-value scan, and `git diff --check`. This validated the retained v0.4.0 tree plus initial Candidate 04 evaluator planning artifacts; the post-freeze full static gate is recorded separately after execution.

## Offline Freeze Result

The evaluator built the exact Candidate 03 runtime delta outside the public Skill tree and verified all prospective Skill/reference/validator hashes and word budgets. The retained hardened grouped validator is copied beside the prospective public validator; it is not imported by the stable public validator.

Seven fresh public synthetic workspaces and seven Prompt files are retained under `/private/tmp/post-v0.4.0-grouped-ledger-candidate-04-offline-freeze-01`. All expected `node --test` exit results matched `7 / 7`. The Q-ID-001 and F-ID-001 repeat pairs match by Git HEAD, Prompt SHA-256, and complete workspace tree SHA-256. Every installed Agent/Cursor Skill tree matches candidate SHA-256 `8d03446b6063ba0cca4931462be8ccd06edbf6d3db985e028b8fa4a45d48f55d`.

The frozen Deep Prompt has SHA-256 `fbe8fcea786c666b60391ef5ab57c669603384f5fcc5b6dd6ecf8d3ea6204032` and requires zero collector calls. Quick Prompts use SHA-256 `c966e9fc6c445a37581bb4df6481d4ad537b908dba8a9837fe2721bf613baa29`; Fix Prompts use `5e316a6038fbbaf44f3d81dd7d3e2f876cb3f5308783c2ebf3dfbf40cebbb7f8`. Both require exactly one supported `--workspace` collector call.

The machine-readable freeze is [`post-v0.4.0-grouped-ledger-candidate-04-offline-freeze.json`](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-04-offline-freeze.json) at SHA-256 `16c340cd13545f973a12211271ec538451e19e9f726572c6268b9e0f1a990990`. No Cursor login, network request, model call, source transfer, or repository runtime-Skill application occurred. Temporary evidence remains retained.

Post-freeze repository validation passes `12 / 12` Vitest files and `134 / 134` tests, saved replay and hashes `7 / 7`, both Skill validators, Node syntax `13 / 13`, JSON parsing `54 / 54`, Markdown local links, the sensitive-value scan, and `git diff --check`. The stable repository and installed Skill SHA-256 remain `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`; the stable public output validator remains `8ca475ad2c6d9184a19716bbad76b483a00c9a6ac85c591088431ef61771ccf3`.

## Source-Free Probe Result

The separately authorized Cursor source-free probe passed once through the frozen literal-argv runner. It sent only the 71-character sentinel Prompt at SHA-256 `95cb2fe6e0fd8c835d1e0b5af232f97e6b5e22f3d1455eca2dbeaf6149d52c49` and returned exact `CLIENT_ISOLATION_OK` with process exit `0`, one assistant message, six trace events, zero tools, MCP calls, commands, retries, endpoint signals, or stderr. The local trace auditor reported `valid: true` with no violations.

The empty probe workspace remained empty and all seven frozen public synthetic workspace content hashes remained unchanged. No source-bearing run executed, no repository runtime-Skill file changed, and no private or public synthetic source was transmitted. Raw credentials, session/request identifiers, and the raw trace remain outside the repository; only the sanitized [probe result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-04-probe-result.json) is retained here at SHA-256 `575001e3b337c5b817040ce08f9acce6f5271df551de0d3db5efa277bd015342`. This is a client-isolation precondition only and provides no model-quality evidence or source-bearing authorization.

Post-record closure passes `12 / 12` Vitest files and `134 / 134` tests, grouped replay `7 / 7`, both Skill validators with cached PyYAML 6.0.3 through process-local `PYTHONPATH`, JSON parsing `120 / 120`, Markdown local links `26 / 26`, the targeted sensitive-identifier scan, stable public and installed Skill hashes, and `git diff --check`.

## Stage 1 Stop Result

The separately authorized `D-ID-001 RUN-01` did not reach the frozen runner. During evaluator preflight, a zsh loop used the lowercase variable `path`. In zsh, `path` is the special array tied to `PATH`; assigning the temporary control path replaced the executable search path, and the following `git` command failed with `command not found`.

The stop occurred after the runner, Prompt, candidate Skill, Deep reference, and fresh output-path checks passed, but before the runner was invoked. Cursor did not start, the control directory and trace artifacts were not created, external model requests remained `0`, and no source was transmitted. Post-stop checks through absolute Git paths confirmed the D-ID workspace remained clean at frozen HEAD `7bb874af85bd9f5fe6a5165397e61896476f3587`, and all seven prepared workspace tree hashes remained unchanged.

Candidate 04 is retained as `No-Go` under its frozen zero-retry, zero-replacement, and zero-mode-switch policy. This is an evaluator-tooling failure and does not change the offline grouped-ledger implementation, but Candidate 04 has no source-bearing model-quality evidence. See the sanitized [Stage 1 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-04-stage-1-result.json) at SHA-256 `775c9b1e0c3f8b3f15504a23fc3a80b6caf4668833212ce47d63cc7cf1a3c36e`.

Post-stop record closure passes `12 / 12` Vitest files and `134 / 134` tests, grouped replay `7 / 7`, both Skill validators with cached PyYAML 6.0.3 through process-local `PYTHONPATH`, changed evaluator-script syntax `4 / 4`, JSON parsing `121 / 121`, Markdown local links `26 / 26`, the targeted sensitive-identifier scan, stable public and installed Skill hashes, and `git diff --check`.

## Static Gates Before Runtime Freeze

Before a source-free probe may be requested:

- rebuild the prospective Candidate 04 Skill and public validator from stable v0.4.0;
- generate the candidate through `scripts/build-grouped-ledger-candidate.mjs` outside the public Skill tree and install it into fixtures through the optional `--skill-source` boundary;
- match every prospective hash and word budget from the migration brief;
- pass all Vitest files, both Skill validators, Node syntax checks, tracked JSON parsing, sensitive-value scan, and `git diff --check`;
- replay all seven grouped-ledger cases with unchanged hashes and expected structural results;
- prepare seven fresh public synthetic workspaces and record complete integrity hashes;
- write every frozen Prompt to an evaluator-owned file outside its workspace and record its SHA-256;
- record the absolute Cursor binary path and version;
- run the fake-client literal-transport test against the exact frozen runner hash.

Any mismatch stops preparation before login, model execution, or source transfer.

## Runtime Window

The separately authorized source-free isolation probe passed the exact-response, zero-tool, zero-MCP, zero-retry, endpoint-signal, Prompt-integrity, and workspace-integrity gates. It is retained as a historical precondition, but the later preflight failure closes Candidate 04 as `No-Go`.

Stage 1 then runs in this frozen order, with separate authorization before every source-bearing request:

1. `D-ID-001 RUN-01`
2. `Q-ID-001 RUN-01`
3. `Q-ID-001 RUN-02`, only if the first two runs pass every gate

Stage 2 may run only after Stage 1 passes `3 / 3`:

1. `Q-ID-002 RUN-01`
2. `F-ID-001 RUN-01`
3. `F-ID-001 RUN-02`
4. `K-ID-001 RUN-01`

Only fresh public synthetic fixture source is eligible. Private source is forbidden. No source-bearing request is authorized by this document.

## Mandatory Gates

Every run independently requires:

- exact Prompt file, Prompt SHA-256, runner SHA-256, client argv, client version, candidate hashes, and fixture hashes;
- required Finding recall and precision, accepted severity, stable IDs, design decision, recommendation, and localized output;
- valid Finding-owned groups, located child conditions, transitions, and merge-basis counts;
- semantic rejection of independently repairable conditions merged under one Finding;
- mode-correct collector execution: zero calls for Deep, exactly one supported `--workspace` call for Quick/Fix, plus the declared deterministic test execution;
- zero retries, equivalent Git inventory rereads, MCP calls, oracle reads, outside-workspace reads, writes, or undisclosed endpoint signals;
- unchanged Git status and complete workspace tree hashes.

The grouped validator proves structure and references only. Semantic oracles remain responsible for issue completeness and merge validity.

## Stop And Rollback

Stop at the first Prompt-integrity, transfer-scope, semantic, structural, severity, recommendation, collector, read-only, isolation, integrity, hash, budget, fixture, replay, or client-contract failure. Do not retry, replace, reinterpret, change modes, or relax a gate.

Rollback restores the stable v0.4.0 Skill, mode references, installed Skill, and public validator while retaining sanitized Candidate 04 evidence. A failed Candidate 04 cannot move the v0.4.0 tag, update installation guidance, or authorize another external run.

## Next Gate

Candidate 04 is closed `No-Go`. Do not retry, replace, reinterpret, or switch modes for `D-ID-001 RUN-01`. A future candidate must freeze a separately reviewed preflight implementation and obtain a new authorization window. Do not apply the runtime Skill candidate to the repository or transmit source under Candidate 04.

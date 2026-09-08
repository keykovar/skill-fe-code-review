# Post-v0.4.0 Grouped Ledger Candidate 06 Evaluation Plan

Status: No-Go; stopped before source-free probe after isolated login failure

Date: 2026-08-28

## Purpose

Candidate 06 addresses the two independent gates exposed by Candidate 05 without broadening review semantics. Candidate 05 remains `No-Go`: its first source-bearing run passed atomic preflight but Cursor could not honor the frozen auto-review mode and fell back to `Allowlist`; the unscored report also wrapped ledger groups and Finding rows in bold syntax that the canonical grouped validator correctly rejected.

Candidate 06 is not a retry or reinterpretation. It requires fresh workspaces, a fresh isolated Cursor HOME and login, a fresh source-free probe, and separate authorization for every source-bearing request. Candidate 05 output and runtime results are not carried forward.

## Frozen Deltas

### Cursor Client Contract

Replace the evaluator's `--auto-review` request with the explicit read-only Cursor mode advertised by the frozen CLI version:

```text
--print
--output-format stream-json
--mode ask
--sandbox enabled
--trust
--workspace <workspace>
<literal Prompt argv>
```

Do not use `--auto-review`, `--force`, `--yolo`, or `--approve-mcps`. Any permission fallback, non-empty capability warning, interactive approval requirement, or effective-mode drift fails the client-contract gate before promotion scoring. Literal Prompt transport, `shell: false`, absolute executables, atomic hashes, Git state, tree integrity, and fresh output isolation remain unchanged.

### Skill Rendering Contract

Add exactly one instruction under core `Finding Requirements`:

> Render these prefixes literally, without bold, italics, or code wrappers: ledger groups start `- [F-NNN]`, `- Behavior Preserving`, or `- Cannot Verify`; Finding rows start `- [F-NNN] [file:line]`.

The instruction budget is at most 30 net English words in `SKILL.md`. Quick, Deep, Fix, frontmatter, adapters, visible output fields, semantic rules, severity, recommendation, collectors, Context7, Playwright, read-only behavior, and the grouped validator remain byte-identical to Candidate 05. Do not add a normalizer or relax the validator to accept decorated prefixes.

## Offline Implementation Gate

Before any external request:

1. Build the exact one-sentence Skill candidate outside the public and installed Skill paths.
2. Change only the evaluator's frozen Cursor argument contract.
3. Test exact `ask` arguments and reject the four forbidden permission flags.
4. Retain deterministic rejection of bold-wrapped group and Finding prefixes.
5. Record exact hashes and word counts.
6. Pass all Vitest files, grouped replay `7 / 7`, both Skill validators, Node syntax, JSON parsing, Markdown links, sensitive-identifier scan, Skill/hash checks, workspace integrity, and `git diff --check`.

The stable public and installed Skill remain v0.4.0 at SHA-256 `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`. The public and installed Skill remain unchanged. Offline implementation authorizes no installation, login, model request, source transmission, commit, or push.

## Offline Implementation Result

Candidate 06 now has a dedicated deterministic builder at `scripts/build-grouped-ledger-candidate-06.mjs` and a dedicated atomic runner at `scripts/run-cursor-evaluation-v3.mjs`. Historical Candidate 04/05 builders, runners, frozen workspaces, and result records were not modified. The v3 runner fixes the client argv to `--mode ask`, keeps the Prompt as one literal final argv value with `shell: false`, rejects all four forbidden permission flags, performs runner/Prompt/client/Git/tree/output-isolation preflight, and classifies capability or permission stderr warnings as client-contract failures.

The offline candidate adds the frozen instruction exactly once. Its `SKILL.md` SHA-256 is `a7145a6d305647c32ed47873b1284575152ff12c7ab61002cea108672dedfae1`; its 12-file Skill tree SHA-256 is `49fd77c07ccb214b4fe464b5019888ac496ca59fd52ba3c04cf8390e8627211d`. `SKILL.md` contains 3,805 English words versus the 3,780-word Candidate 05 baseline, for an exact `25 / 30` net-word delta. Quick, Deep, Fix, adapters, frontmatter, grouped validator, and review-output validator remain byte-identical to Candidate 05. Bold-wrapped group and Finding prefixes remain invalid.

Offline closure passes `16 / 16` Vitest files and `151 / 151` tests, grouped replay `7 / 7`, both Skill validators using the existing isolated PyYAML 6.0.3 environment with no install, Candidate 06 Node syntax `2 / 2`, JSON parsing `127 / 127`, Markdown local links `164 / 164` across 56 repository Markdown files, the targeted sensitive-identifier scan, and `git diff --check`. Candidate 05 prepared workspace trees remain hash-identical `7 / 7`. The stable public and installed Skill SHA-256 remains `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`. No external model request or source transmission occurred.

## Offline Workspace Freeze Result

After explicit authorization, `scripts/prepare-grouped-ledger-candidate-06.mjs` created seven fresh public-synthetic workspaces under `/private/tmp/post-v0.4.0-grouped-ledger-candidate-06-offline-freeze-01`. All declared fixture tests matched their expected exit code `7 / 7`; Q-ID-001 and F-ID-001 repeat pairs are byte-identical `2 / 2` by HEAD, Prompt SHA-256, and complete workspace tree SHA-256. A second independent tree pass matched every frozen workspace `7 / 7`.

Each workspace contains the exact Candidate 06 Skill tree SHA-256 `49fd77c07ccb214b4fe464b5019888ac496ca59fd52ba3c04cf8390e8627211d` and a complete v3 preflight contract for Cursor CLI `2026.08.11-e8db854`. The sanitized freeze record is `evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-06-offline-freeze.json`, SHA-256 `46921892fb1f977558aa985d605354a925135d9b304134e9853019967ef61c22`. Preparation executed zero model requests, created no Cursor login, transmitted no source, and ran no source-bearing Review.

Post-freeze closure passes `17 / 17` Vitest files and `152 / 152` tests, grouped replay `7 / 7`, both Skill validators, Candidate 06 Node syntax `3 / 3`, JSON parsing `128 / 128`, Markdown local links `164 / 164` across 56 repository Markdown files, the targeted sensitive-identifier scan, and `git diff --check`. A final integrity pass keeps the seven prepared workspace trees unchanged `7 / 7`; the public and installed Skill hashes remain stable.

## Source-Free Probe Attempt Result

After separate authorization, one fresh isolated Cursor HOME was created and one login flow was started. Cursor exited with code `1` and reported `Login failed or timed out. Please try again.` before authentication completed. Under the frozen zero-retry and zero-replacement policy, Candidate 06 stopped immediately: the source-free workspace and trace were never created, the sentinel Prompt was never sent, and no model request, tool, command, MCP call, source transmission, or source-bearing Review occurred.

The isolated HOME retains ten Cursor state/cache files; their contents, account identity, login URL, challenge, session, request, and credentials are not recorded. The seven prepared workspace trees remain unchanged `7 / 7`. The sanitized result is `evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-06-probe-result.json`, SHA-256 `3abb35a9bcb000ffc56b6b2052bde885b06fa41da0bf7762fa2576ae0b204f1b`. Candidate 06 is `No-Go` before runtime Skill-quality scoring.

Post-stop closure passes `17 / 17` Vitest files and `152 / 152` tests, grouped replay `7 / 7`, both Skill validators using the existing isolated PyYAML 6.0.3 environment with no install, Candidate 06 Node syntax `3 / 3`, JSON parsing `128 / 128`, Markdown local links `164 / 164` across 56 repository Markdown files, the targeted sensitive-identifier scan, and `git diff --check`. The Candidate Skill tree remains SHA-256 `49fd77c07ccb214b4fe464b5019888ac496ca59fd52ba3c04cf8390e8627211d`; the public and installed Skill remain SHA-256 `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`. The seven prepared workspace trees remain unchanged `7 / 7`; model requests and source transmissions remain zero.

## Frozen Runtime Window (Closed)

The planned runtime window required a source-free probe with exact `CLIENT_ISOLATION_OK`, zero tools, commands, MCP calls, warnings, retries, unexpected endpoints, or workspace changes. Because login failed before that probe, no model-quality evidence exists and every source-bearing run below is cancelled.

Stage 1 remains:

1. `D-ID-001 RUN-01`
2. `Q-ID-001 RUN-01`
3. `Q-ID-001 RUN-02`, only if the first two pass every gate

Stage 2 remains:

1. `Q-ID-002 RUN-01`
2. `F-ID-001 RUN-01`
3. `F-ID-001 RUN-02`
4. `K-ID-001 RUN-01`

Stop at the first client-contract, Prompt, transfer, semantic, structural, severity, recommendation, collector, read-only, isolation, integrity, hash, budget, fixture, replay, or client warning failure. Do not retry, replace, reinterpret, or switch modes.

## Next Gate

Candidate 06 is closed `No-Go`. Do not retry or replace the failed login, execute the source-free probe, or start any source-bearing run. A future candidate requires a newly frozen runtime window and separate authorization. Candidate 05/06 temporary login, cache, workspace, trace, and offline-build data remain retained until separately authorized cleanup.

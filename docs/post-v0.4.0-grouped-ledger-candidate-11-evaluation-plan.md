# Post-v0.4.0 Grouped Ledger Candidate 11 Evaluation Plan

Status: No-Go after first source-bearing run; remaining six runs cancelled by stop rule

Date: 2026-09-01

## Purpose

Candidate 11 is a new evaluation window after Candidate 10 closed `No-Go`. It does not retry, replace, reinterpret, or relax Candidates 05-10. The Candidate Skill, mode references, grouped validator, visible output fields, severity rules, recommendation rules, review scope, runner v5, and outer Seatbelt profile remain byte-identical.

The retained Cursor evidence now rules out every Shell-based unattended contract available to this account and client version:

| Contract | Retained result |
| --- | --- |
| Auto-review | Unavailable; fell back to Allowlist |
| Ask mode Shell | Read-only Git inventory denied |
| Plan mode Shell with client sandbox | Requested workspace read-write; nested sandbox failed under outer Seatbelt |
| Plan mode Shell without client sandbox | Command completed as `result.rejected`, `isReadonly: false`, zero executions |

Candidate 11 therefore removes Cursor-owned Shell execution from the evaluation contract. It does not weaken the read-only requirement; it assigns deterministic Git inventory, context collection, and test execution to the local evaluator and limits Cursor to read-only file tools inside the frozen workspace.

## Frozen Runtime Contract

Reuse runner v5 byte-for-byte with:

```text
--print
--output-format stream-json
--mode plan
--sandbox enabled
--trust
--workspace <workspace>
<literal Prompt argv>
```

The mandatory outer `/usr/bin/sandbox-exec` profile continues to deny `file-write*` for the reviewed workspace and the configured repository parent directory. `--auto-review`, `--force`, `--yolo`, and `--approve-mcps` remain forbidden. Any Shell call, MCP call, write tool, outside-workspace read, warning, permission fallback, mode drift, workspace mutation, or hash drift stops Candidate 11.

## Source-Free Read Capability Probe

The fresh source-free workspace may contain only Git metadata, the 12-file public Candidate Skill, and one public `probe.txt` sentinel. The exact Prompt is:

```text
Use the read-only file tool exactly once to read probe.txt in the current workspace, then return exactly PLAN_READ_ONLY_OK. Do not use Shell, MCP, other tools, or modify anything.
```

The dedicated auditor must require exactly one started and completed read-only file-tool call resolving to `<workspace>/probe.txt`, zero Shell calls, zero MCP calls, no other tools, an unchanged workspace tree, an exact final `PLAN_READ_ONLY_OK` response, and a result event equal to the ordered assistant aggregate. It must reject missing results, rejected or failed reads, absolute or relative path escape, additional reads, non-text assistant content, output drift, and mutation.

Passing this probe would prove only Cursor Plan-mode file-read capability under the macOS outer Seatbelt boundary. It would not prove review quality and would authorize no source-bearing request.

## Prospective Source-Bearing Contract

Before any source-bearing authorization, seven fresh public-synthetic workspaces must be prepared. The evaluator, not Cursor, must execute deterministic commands before freezing each workspace:

1. Run declared fixture tests exactly once and freeze exit code plus stdout/stderr hashes.
2. For Quick/Fix, run the supported context collector exactly once and embed its frozen output in the literal Prompt.
3. For Deep, freeze the Git inventory and review scope in the literal Prompt without requiring a Cursor Shell call.

Cursor must execute zero Shell commands, collectors, and tests. It may use read-only file tools only inside the reviewed workspace. The execution audit must separately verify read boundaries, zero writes, zero MCP, zero Shell, output structure, semantic oracle, severity, recommendation, Finding identity, repeat behavior, and unchanged workspace hashes.

This contract changes evaluator ownership only. It does not change the public Skill or claim that arbitrary Cursor sessions can discover repository context without evaluator-supplied evidence.

## Offline Gates

Before any external request:

1. Implement a dedicated Read-probe auditor without changing runner v5 or historical auditors.
2. Test exact successful reads, rejected/failed reads, path escape, additional tools, output aggregation, and workspace mutation.
3. Verify runner v5, Seatbelt, Candidate Skill, public Skill, and installed Skill hashes remain unchanged.
4. Pass full Vitest, grouped replay, both Skill validators, Node syntax, JSON parsing, Markdown links, sensitive-identifier scan, and `git diff --check`.

## Offline Freeze Result

The seven fresh public-synthetic workspaces are now frozen under the external temporary root. The evaluator matched all declared fixture exits `7 / 7`; non-Deep context collection ran locally exactly once for `6 / 6` runs, and the Deep Git inventory was frozen locally for `1 / 1` run. The Q-ID-001 and F-ID-001 repeat assertions match by HEAD, Prompt SHA-256, status SHA-256, and complete workspace tree SHA-256 (`2 / 2`). Cursor is expected to execute zero Shell, MCP, collector, or test calls for every run.

The sanitized [offline freeze record](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-11-offline-freeze.json) contains only case/run identifiers, hashes, exit codes, evaluator counts, and policy flags. Its SHA-256 is `54164bdc7ac0a9855ac47cfa44275482df37428b37b8f1a1ca45217582e790e8`. Preparation made zero external model requests and transmitted no source; source-bearing execution was still unauthorized at freeze time.

## Offline Closure

The dedicated Read-tool auditor is implemented without changing runner v5, the outer Seatbelt profile, historical auditors, the Candidate Skill, or the public and installed Skill. Its `7 / 7` targeted tests cover the exact successful read, failed and rejected reads, path escape, additional tools, result aggregation, and workspace mutation. Path comparison canonicalizes existing paths before enforcing the workspace boundary so macOS `/var` and `/private/var` aliases do not create a false escape while symlink targets remain subject to the real workspace boundary.

Local validation passes `27 / 27` Vitest files and `188 / 188` tests, grouped replay `7 / 7`, both Candidate Skill validators, Node syntax `23 / 23`, JSON parsing `144 / 144`, and `172 / 172` local Markdown links across 61 repository Markdown files. The targeted sensitive-identifier scan reports zero matches and `git diff --check` passes. Runner v5, the Seatbelt profile, the Candidate Skill tree, and the public and installed Skill hashes remain equal to the frozen values. External model requests and source transmissions remain zero.

## Source-Free Probe Result

After explicit authorization, a fresh isolated Cursor HOME and a fresh workspace were created. The workspace contained only the frozen public Candidate Skill and `probe.txt`; no project or private source was included. Cursor Agent `2026.08.11-e8db854` ran once through runner v5 with Plan mode, client sandbox enabled, and the mandatory outer Seatbelt profile.

The probe passed: process exit `0`, stderr `0`, auditor `valid: true`, exactly one started and completed workspace-local Read-tool call, zero Shell calls, zero MCP calls, zero other tools, exact final `PLAN_READ_ONLY_OK`, matching result aggregate, and unchanged Git status and workspace tree. The sanitized [probe result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-11-probe-result.json) records the contract and hashes without account, session, credential, or raw trace content.

This is only a client capability precondition. It does not prove review quality or permit arbitrary source discovery. The temporary HOME and raw trace remain outside the repository pending separate cleanup authorization.

## Source-Bearing Result

After explicit authorization, `D-ID-001/RUN-01` was executed first with the frozen Deep contract. Runner preflight and postflight passed: exit `0`, stderr `0`, zero Shell/MCP calls, workspace status/tree unchanged, and all frozen hashes matched. The model output failed the canonical grouped ledger validator: multiple coverage entries lacked the required before/after relation and disposition fields. The sanitized [Stage 1 result](../evaluation/runtime-windows/post-v0.4.0-grouped-ledger-candidate-11-stage-1-result.json) records the failure at SHA-256 `1d3a423a9574b5326be5983ad7840dc0d5c55d099bddbb0baf107058dd1d7eea` without retaining raw output, account data, session identifiers, or credentials.

The stop rule closed Candidate 11 at `1 / 7`. No retry, replacement, mode switch, reinterpretation, or remaining source-bearing request was executed. The public synthetic source was the only transmitted source; private source was never allowed or transmitted.

## Next Gate

Candidate 11 is closed `No-Go`. Do not execute the remaining six runs or retry `D-ID-001/RUN-01`. Retain the temporary HOME, raw trace, output, and frozen workspaces until separate cleanup authorization. Any future candidate requires a new frozen window and explicit source-bearing authorization.

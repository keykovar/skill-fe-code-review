# Deep Read-Call Template Runtime

2026-10-14: **Window 04 passes one frozen format-only Deep pilot.** This is a
single accepted run for the public synthetic `FC-D-001` case. It validates the
corrected four-call startup procedure and the report contract for this case;
it does not promote the candidate or establish general review accuracy.

## Runtime Result

The user authorized one independent Codex Desktop task:

- Task: `01a138ed-bfdc-7fa2-a6e0-5c3f6feada0b`
- Provider route checked before dispatch: Joymeet `https://t.kxmeet.com`,
  Responses API, local provider id `custom`
- Model: `gpt-6-astra / xhigh`
- Dispatch-to-final: **283,393 ms**; task turn duration: 199,260 ms
- Attempts: 1; retries, follow-ups and report edits: 0

The task made exactly four read-only `/bin/cat` calls from the frozen packet
workspace. It read `materials.json`, then `batches/01.json`, `batches/02.json`
and `batches/03.json` in order. Every call contained both:

- outer `// @exec: {"max_output_tokens":20000}`;
- inner `exec_command.max_output_tokens: 20000`.

The four model-visible payloads matched the native command outputs and frozen
hashes. They reconstructed all nine evidence files. No duplicate, outside,
installed-Skill, host-repository or write operation was recorded.

## Acceptance Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Material delivery | Pass | 4/4 reads, exact bytes, 9 reconstructed files |
| Output-budget protocol | Pass | Both budget layers are 20,000 on all 4 calls |
| Output structure | Pass | v0.6.0 validator passes; 9 Coverage entries; zero findings |
| Manual semantics | Pass | 8/8 source-and-oracle checks |
| Read-only scope | Pass | Four allowlisted reads; no outside read or write |
| Material/history integrity | Pass | Independent freeze and 154 protected-file hashes pass |
| Elapsed time | Pass | Below the 900,000 ms ceiling |

The report correctly states that the supplied `src/auth/session.mjs` target is
missing, while `src/profile.mjs` can be statically compared. It does not turn
the missing source into a fabricated defect. It records zero Blocking/Risk/
Improve findings, marks the overall design `Cannot Verify`, and repeats the
same session/token comparison prerequisite in the conclusion and final
recommendation. The report's high risk label is explicitly qualified as
missing authentication evidence rather than a proven high-severity finding.

The unchanged parser reports `valid: true`, `coverageLedgerEntries: 9`, and no
Finding IDs. Manual semantic acceptance does not mean a general accuracy rate.

## Usage And Limits

Client-reported cumulative usage was 217,170 input tokens, including 187,264
cached input, 5,516 output tokens, including 2,070 reasoning output, and
222,686 total tokens. These values are recorded with provenance; no matched
control exists, so no cost, token-saving or efficiency claim is accepted.

Evidence files are retained under
`.local-evaluation/ledger-format-deep-call-template-01/`, including the raw
session, unedited report, read trace, visible receipts, delivery inspection,
parser result, integrity result, manual semantic assessment and window
decision. The capture and assessment scripts do not execute trace-supplied
code. Formal and installed Skill remain v0.6.0.

Projectless remains a task target rather than an OS filesystem sandbox. This
run shows adherence to the explicit read contract in one task; it does not prove
that arbitrary future tasks cannot read outside the packet. The report also
does not establish runtime authentication behavior because no target session
source, tests, real account or execution evidence was supplied.

## Decision

Window 04 is accepted for this single frozen FC-D-001 format-only Deep pilot.
Candidate promotion, formal Skill change, installation, release, matched-cost
comparison, full client isolation and general accuracy remain unauthorized or
unverified. Do not repeat this accepted case solely to accumulate passes.
Select a genuinely uncovered case before requesting another provider run.

# Large-diff File Coverage Deep Runtime

## Window 03 No-Go

2026-10-14: the separately authorized Candidate `FC-D-001` task stopped before
any source-bearing read. It attempted the single required command:

```text
cat /private/tmp/fe-file-coverage-comparison-03/control/launch.md
cat: .../control/launch.md: No such file or directory
```

The preparation builder had created the workspace and freeze metadata but had
not written the required `control/launch.md`. The task followed the stop rule:
it made no retry, no fallback read, no source read, no model review request and
no write or repository operation. This window is **No-Go for dispatch
preparation**, not a finding about the Skill or reviewer accuracy.

The task was `01a139bb-80dd-7bf0-b647-39021f1fae84`, using a projectless
Codex Desktop task. No private source or credentials were transmitted. The
failed window and its freeze remain historical evidence and are not overwritten.

## Corrected Window

The builder now writes `control/launch.md` and the focused test requires that
file to contain the unique workspace path and Deep startup instructions. A new
window `file-coverage-comparison-03b` is prepared separately at
`/private/tmp/fe-file-coverage-comparison-03b-1791971219972`; its independent
freeze digest is
`0fd0fa14402c030d9c128c0a4397be2a810f1f5ab98e7cdb937c9468629f831c` and local
verification reports `Offline Pass` for both 18-read runs.

The correction does not change the formal Skill, the candidate bundle, the
public packet, the evaluator oracle, or the no-retry rule. A new external run
requires fresh explicit authorization after the corrected freeze is inspected.

## Corrected Window 03b Candidate Result — No-Go

2026-10-14: the separately authorized Candidate `FC-D-001` Deep task completed
the corrected source-bearing run in
`/private/tmp/fe-file-coverage-comparison-03b-1791971219972`. The task was
`01a139ea-62d5-7922-9219-16f0334c5d2b`, using the requested Codex Desktop
`gpt-6-astra / xhigh` route. The run used freeze
`0fd0fa14402c030d9c128c0a4397be2a810f1f5ab98e7cdb937c9468629f831c` and took
`614,673 ms`, below the 900-second Deep pilot ceiling.

The execution trace is within the frozen boundary: 19 successful command
executions, consisting of the startup read plus all 18 ordered material reads;
there were no failed commands, outside reads, source execution, tests, Git,
network, browser, installation, login, writes or retries. The unedited report
contains eight changed-condition entries and no findings. Its file accounting
is `Complete; 2 paths; Reviewed 1 / Cannot Verify 1`; the missing
`src/auth/session.mjs` target remains an explicit evidence gap, and the report
does not invent an authentication defect. `Reproduction: Not Run` and the
final prerequisites are consistent with that boundary.

The run is nevertheless **No-Go** for the candidate quality gate. The formal
v0.6.0 validator returns `valid: false` with one
`coverage-ledger-unexpected-content` error at report line 56: the Coverage
section contains a prose sentence before its ledger entries. This violates the
unchanged strict output grammar even though the eight ledger entries themselves
and the semantic evidence boundary are correct. The raw report and trace remain
unchanged; the line is recorded for diagnosis rather than corrected in place.

Stable `FC-D-001` is not executed. Candidate promotion, formal Skill changes,
installation, commit, push and release remain out of scope. Investigate the
format failure offline and create a newly frozen pair only if the next step is
explicitly authorized; do not rerun this unchanged window or relax the parser.

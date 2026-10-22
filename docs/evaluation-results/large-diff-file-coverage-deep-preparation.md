# Large-diff File Coverage Deep Preparation

2026-10-14: **Offline preparation pass; no model run.** The previously frozen
file-coverage comparison contains an unexecuted Deep pair for the candidate and
stable Skill. This follow-up adds a bounded model-visible read schedule for that
pair without changing the formal Skill, the candidate bundle, the source packet,
the historical Quick results, or the evaluator oracle.

## Frozen Scope

The two runs remain `FC-D-001` in the original order: candidate first, stable
second. Each workspace contains the same 11 logical files and the same public
synthetic packet; only the selected Skill instructions differ. The unavailable
authentication owner remains an evaluator-declared evidence gap and is not
included as a source file. The oracle and expected accounting stay outside the
reviewer workspaces.

The new preparation assigns 18 read receipts to each run. `materials.json` is
read first, followed by contiguous UTF-8 line ranges for the Skill files,
Deep/release-risk references, packet metadata, context, and source snapshots.
Each range is at most 6,000 bytes. The startup asks for both the shell and outer
tool output budgets to be at least 20,000 tokens and requires immediate stop on
truncation, missing receipts, or failed reads. This is a prompt contract;
client behavior and OS isolation remain unproven.

| Run | Files | Reads | Delivered bytes | Startup bytes |
| --- | ---: | ---: | ---: | ---: |
| `03-deep-candidate` | 11 | 18 | 65,206 | 2,413 |
| `04-deep-stable` | 11 | 18 | 58,175 | 2,413 |

The independent freeze digest is
`079915460e254ab4ea15331b8fbf0299679eb4f401933cb5e30594fb9e9feee0` for this
local preparation recipe. The actual test creates a fresh temporary root; no
provider request or source transmission occurred.

## Local Checks

The new `prepare-file-coverage-deep.mjs` builder and its 12 tests verify:

- candidate/stable ordering, unchanged parent identity, and `Not Run` status;
- equal read counts and startup bytes across the pair;
- contiguous range reconstruction, per-range byte bounds, and exact hashes;
- exclusion of oracle, plan, history, report, and other evaluator files;
- rejection of missing, reordered, truncated, extra, symlinked, and changed
  material or control files;
- independent freeze-digest and destination-boundary checks.

The focused suite passes **12/12**. This is deterministic packet preparation,
not Deep semantic acceptance, file-coverage accuracy, token/latency comparison,
client isolation, candidate promotion, installation, or release evidence.

## Next Gate

The pair is now locally dispatchable only after a separate explicit execution
authorization, current provider/model preflight, and a final freeze-hash check.
The stable/candidate Quick sequence remains closed after its No-Go; this Deep
preparation does not authorize a retry or automatically authorize the Fix pair.

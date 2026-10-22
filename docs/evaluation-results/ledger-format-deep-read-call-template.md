# Deep Read-Call Template Preparation

2026-10-14: **Offline Pass; runtime Not Run.** The local follow-up to
[Window 03's output-budget No-Go](ledger-format-deep-projectless-runtime.md)
is complete. No provider request, model task, credential access, installation
or formal Skill change occurred.

## Narrow Fix

Window 03 set the shell budget but omitted the outer `functions.exec` budget.
Its actual data was complete and its report passed semantics; the frozen
execution contract still failed. A new local generator now supplies the exact
four permitted read calls, each with both values set to 20,000 tokens:

```javascript
// @exec: {"max_output_tokens":20000}
const result = await tools.exec_command({"cmd":"/bin/cat \"materials.json\"","workdir":"/absolute/frozen/workspace","login":false,"yield_time_ms":10000,"max_output_tokens":20000});
text(result.output);
```

The real frozen launch contains its full absolute directory and all four
ordered calls, without placeholders. It explains which budget controls which
layer and stops if the client cannot support the supplied invocation. The
source material, candidate Skill, oracle, read count and semantic/elapsed gates
remain unchanged.

The new generator reuses the pinned preparation recipe without editing it.
It stores a dispatch launch and freeze beside a fresh, independently verified
base preparation. The dispatch freeze is the authoritative startup accounting;
the inherited base launch is retained for provenance and is not also sent.
`read-calls.json` is evaluator data and adds no fifth reviewer read.

This is a prompt template, **not enforced client configuration**. The task API
does not let the parent mandate the child's outer output budget. Local parsing
of the pragma and replay of generated snippets do not prove that a future
model will retain it, or that the client will honor a particular output ceiling.
Actual tool arguments and returned bytes remain runtime checks. Projectless
also provides no filesystem allowlist.

## Local Verification

All **127 tests in six files pass**, including 27 new template checks. The tests
build their own public upstream fixtures and cover:

- Two explicit output budgets and unchanged four-read ordering.
- Rejection of omitted/lowered budgets, changed cwd, reordered calls or extra
  tool code, even when altered files are re-pinned in a recomputed freeze.
- Native replay of trusted generator output, reconstructing nine exact files;
  no historical trace-supplied JavaScript is executed.
- Recipe/hash/accounting drift, extra files, symlinks, relocated workspaces,
  protected destinations and structured escaping of the working directory.

The prepared Window 04 additionally passes four native read replays and exact
source reconstruction. **154 protected files** retain their hashes, including
formal Skill files, prior accepted/failed windows and the old preparation code.
No old freeze, report, oracle or test result is rewritten.

## Frozen Window 04

Local root: `.local-evaluation/ledger-format-deep-call-template-01/window-04/`.

- Dispatch freeze: `b6b1730886cfefe092f813083aa9bd1be4a45524c38114e763206d718262d5fb`.
- Base preparation freeze: `146a96ca4cac5771f3bbcae421836604d83d8e8f6905c2e3a3f7ddcadd28216a`.
- Dispatch launch: `3eac5e078dbed95c9d0a9570f06a4c83fc94884c33f528dc6a00fade77083a69`.

| Content | UTF-8 bytes |
| --- | ---: |
| Original nine evidence files | 53,389 |
| Manifest plus three batch payloads | 57,677 |
| Dispatch startup including four call templates | 4,989 |
| Payload plus startup, counted once | 62,666 |

The launch is 2,005 bytes larger than Window 03, including the different local
path. These are content bytes, not token or billing estimates. No efficiency
improvement is claimed.

## Next Decision

The local preparation gate is complete. A future single Window 04 Deep run
requires explicit new task-creation authorization, a current provider check and
revalidation of the dispatch freeze. It would use `gpt-6-astra / xhigh` and the
same nine public candidate/source files, with no oracle, historical reports or
private business source. Only `window-04/launch.md` is the startup to send.

Do not automatically retry Window 03 or repeat accepted Quick. Passing local
tests does not close the runtime budget gate, promote the candidate or authorize
installation/release. Formal/installed v0.6.0 remains unchanged.

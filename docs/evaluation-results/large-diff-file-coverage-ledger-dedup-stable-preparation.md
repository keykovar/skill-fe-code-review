# Deduplicated Deep Stable Preparation

2026-10-19 preparation: **Offline Pass; Stable was unclaimed and Not Run at this gate.** A separate exact
Stable dispatch is prepared for the
[accepted Candidate pilot](large-diff-file-coverage-ledger-dedup-deep-replacement-runtime.md).
It uses the existing frozen Stable arm, formal v0.6.0 instructions and the same
public synthetic FC-D-001 source packet. No model task or network request was
made during preparation.

Subsequent execution: the separately authorized
[Stable runtime is No-Go](large-diff-file-coverage-ledger-dedup-stable-runtime.md)
for strict Coverage formatting. Exact delivery and 8/8 manual checks pass, but
the pair is not accepted. This preparation receipt remains unchanged.

## Dispatch Entry

The accepted Candidate's v1 dispatcher is pinned by its receipt. It remains
byte-identical. The additive
`evaluation/prototypes/prepare-file-coverage-deep-dispatch-v2.mjs` preserves the
existing guards and adds an explicit Candidate/Stable selector plus a Stable
prerequisite check. Versioning preserves the historical recipe hash; it does
not change the Skill version or create a new review mode.

For Stable, preparation and claim both require independently pinned Candidate
adjudication and completion records, the matching raw report hash, the same
material freeze and candidate manifest, eight passing manual checks, passing
delivery/format/integrity/elapsed gates, and matching provider/model/effort
evidence. A No-Go, another window, modified report, or changed receipt stops
dispatch. Accepted Candidate result directories are protected from output
overlap, including aliases through symlinks.

The exact Stable prompt is returned as structured `create_thread` arguments:
`projectless`, `gpt-6-astra`, `xhigh`, title `Stable Deep Review FC-D-001`.
Candidate reports, acceptance records, evaluator oracle and route metadata
remain local to the evaluator; none is appended to the Stable prompt or its
material allowlist. The same one-use claim and no-overwrite rules apply.
Results belong outside the frozen materials, in this dispatch's `results/`.

Configuration inspection uses the existing Python 3.11+ TOML standard library.
No dependency was installed. Current config is `custom`,
`https://t.kxmeet.com`, `responses`, default `gpt-6.1-sol / xhigh`; the prepared
request explicitly sets `gpt-6-astra / xhigh`. Claim rechecks config, materials
and Candidate evidence immediately before creation. This is configuration
evidence, not attestation of the actual provider or upstream model.

## Frozen Identity

| Item | Value |
| --- | --- |
| Existing material root | `/private/tmp/fe-file-coverage-ledger-dedup-deep-02-20261019` |
| Material freeze SHA-256 | `4ca35a745d5a81dcc72c3cf39b8d0a3aae2dd64840218ae59ea947452790d684` |
| Stable dispatch directory | `.local-evaluation/file-coverage-ledger-dedup-01/stable-dispatch-02` |
| Stable preflight SHA-256 | `851e539a3e3e8522c1b8a037b5c17392cc6e0226dd66113c3b3243f2ae04cdbb` |
| Stable prompt SHA-256 | `d4d717ae7e083690a5b0cc19db2a896b219f97f5685a582ee34c8ba9e6ad2078` |
| Candidate adjudication SHA-256 | `da24fb88289f99ee11c87e611961a594a697bf88c497c2ed7abd7e73f7ce0e94` |
| Candidate completion SHA-256 | `259bcfa685d4ae52197807930ee9ab339ec70c17140033a4c6d60aa9757fc172` |
| Candidate raw report SHA-256 | `55a89e469dea91c63eef813d7abc9a8cd38808a54a99844d85e1e964ebf2d889` |
| V2 dispatcher SHA-256 | `4d3fa3aacecbc054a40259aeadd653dfb8371a0d48af387294d136641b897635` |
| Evidence files / calls | 9 / 19 |
| Prompt bytes / total delivered content bytes | 705 / 65,685 |

Content accounting includes the prompt, startup and all prescribed material
returns, excluding tool wrappers and client context. No source, instruction,
oracle, read schedule, acceptance threshold or prior result was changed.
The material builder's inherited plan label/date remain historical metadata;
the actual root and hashes identify this comparison window.

## Local Validation

**80/80 tests pass across four suites.** The 31 new Stable tests cover exact
prompt selection, unchanged Candidate request parity, no answer leakage,
missing/wrong acceptance pins, No-Go and partial checks, different windows,
candidate identity, thread/model/provider mismatch, modified reports, claim-time
drift, source/request/config changes, output overlap and repeated claims.
The existing 49 dispatch/preparation/dedup checks also pass. Tests use public
synthetic materials and simulated acceptance receipts; these are unit-test
fixtures, not fabricated runtime evidence.

The first run passed 79/80: a test's broad `stable-dispatch` substring matched
the temporary directory name. The assertion was corrected to check the actual
dispatch filename; the implementation and frozen prompts were unchanged.
The final pass does not erase that local diagnostic or relax delivery rules.

Real preparation against the retained Candidate acceptance and frozen Stable
arm passes. All 59 material/input pins and 22 explicitly retained Candidate,
history, dispatcher and formal-core pins remain unchanged. The installed Skill
still resolves to the formal repository directory. The preparation is recorded
in `.local-evaluation/file-coverage-ledger-dedup-01/prepare-stable-dispatch-02.mjs`
and `stable-dispatch-02-preparation-receipt.json`. The full suite was not rerun
for this isolated evaluator change.

## Next Gate

Obtain separate authorization for one independent Stable Deep task. Use the v2
module's `claimFileCoverageDeepDispatch` with the pinned Stable preflight digest
and pass its returned object directly to `create_thread`. Do not rewrite the
prompt, read the dispatch file from the reviewer task, or include Candidate
answers. Keep the claim even if task creation fails or its outcome is unknown;
do not retry automatically.

After execution, audit the actual prompt, nineteen complete calls, source
boundaries, unedited report and identical conclusion/ending prerequisites.
Stable uses the unchanged v0.6.0 parser; candidate-only file-summary grammar is
not imposed. Verify its recorded client/provider/model/effort against Candidate
(`0.163.0-alpha.10.2`, `custom`, `gpt-6-astra / xhigh`) before accepting a matched
comparison. An upstream identity or price remains unverified.

Only two accepted reports can establish the bounded comparison. Retain the
frozen Candidate/Stable ceilings of 1.0 for cumulative input-plus-output tokens,
elapsed time and tool calls, and the 900,000 ms individual Deep ceiling.
Candidate's retained measurements are 984,504 total tokens and 280,309 ms.
No cost-saving, general-accuracy, enforced-isolation, automatic-cancellation,
promotion or release claim follows from this local preparation.
Formal/installed v0.6.0 and `runtimeReady=false` remain unchanged; no model
invocation, installation, commit or push occurred in this step.

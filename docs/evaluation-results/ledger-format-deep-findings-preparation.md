# Deep Findings Fixture Preparation

2026-10-20 preparation snapshot: **Offline Pass; LF-D-002 was prepared and Not Run.** This public
synthetic case addresses the remaining nonempty Deep Findings path identified
in the [format-only closeout](ledger-format-current-closeout.md). It reuses the
unchanged format-only candidate and strict v0.6.0 validator. No model task,
network transfer, installed Skill change or release occurs in this step.

Follow-up: [the separately authorized single runtime pilot now passes](ledger-format-deep-findings-runtime.md).
The preparation and preflight snapshots below are retained unchanged in their
original evidence files; use that runtime record for current execution status.

## Source And Oracle

The complete comparison contains one changed JavaScript module and one unchanged
direct-consumer module. It has no credentials, personal data, private business
source, network access, external dependency or production environment.

| Independent issue | Before | Target | Minimum repair |
| --- | --- | --- | --- |
| Timeout parameter propagation | Pass the explicit timeoutMs through. | Always return 30000. Profile supplies 1500; activity supplies 8000. | Restore the existing timeoutMs field to the parameter. |
| Page-size propagation | Map pageSize to limit. | Always return 50. Inbox supplies 20. | Restore limit: pageSize in the separate helper. |

The deterministic source tests confirm the two-way repair counterfactual:
restoring timeout propagation fixes both direct consumers but leaves inbox at
50; restoring pagination fixes inbox but leaves both timeouts at 30000.
Restoring both fields recovers all three direct-consumer results. Supported
unchanged values, timeout 30000 and page size 50, also retain their outcomes.
There is no unsupported input cross-product.

The evaluator-only oracle expects two independently repairable **Risk / New /
Not Run** findings. No backend, timer, page failure or canonical Blocking
outcome is delivered, so local parameter mismatch must not be inflated to
Blocking. The two timeout manifestations share one discarded parameter and
one returned property; a single restoration fixes both. They may share one
Finding ID with a consistent nonempty Merge key when rendered separately.
The pagination defect must retain its own ID.

The source tests execute only these local synthetic functions, with an injected
recorder returning the received path/options. Their results are never delivered
to the reviewer. Consequently a later static report must still use
`Reproduction: Not Run`, not infer observations or a numerical occurrence
probability from this preparation.

## Output Controls

The authored Chinese report is an evaluator-only format control, not model
output or an accepted review. It passes the unchanged validator with two Risk
findings, five outcome entries and repeated F-001 keys. Its conclusion and
ending repeat the same two repairs and bounded verification prerequisite.

Negative controls cover prose in Coverage, inconsistent/missing Merge keys, a
key on a single ID and unsupported probability. Separate fixture-oracle
controls demonstrate that these errors can remain structurally valid and must
still be rejected: merging the independent defects, inventing an Observed
execution, claiming a retained rather than introduced defect, adding a final
prerequisite, or changing the ending to unconditional approval.

The case-specific authored controls use known report mutations. They are **not
a general semantic validator** for free-form model responses. Actual reports
still require source-grounded manual assessment; wording need not match the
authored report. A parser pass alone is insufficient.

There is **no fixed runtime Coverage row count**. A model may correctly group
the two timeout inputs if every before/after outcome and consumer propagation
remains explicit. In that event, semantic quality can pass while the repeated-ID
subgate remains **Not Exercised**. Do not invent another defect, force an extra
row, or retry automatically to manufacture that coverage. Merge-key wording is
not fixed; its repair meaning and consistency are what matter.

## Frozen Delivery

The nine evidence files consist of core Skill, Deep/JavaScript/release-risk
references, packet metadata/context, both options snapshots and the unchanged
loader. Only these files are encoded into the payload. The oracle, authored
report, test results, prior runtime reports and expected Finding IDs remain in
evaluator controls outside the read allowlist.

| Measurement | Value |
| --- | ---: |
| Evidence files | 9 |
| Original evidence bytes | 53,452 |
| Encoded batches | 3 |
| Encoded batch bytes | 55,561 |
| Batch sizes | 19,767 / 19,795 / 15,999 |
| Manifest bytes | 2,136 |
| Frozen startup bytes | 2,729 |
| Prompt plus manifest and batch content | 60,426 bytes |
| Planned read calls | 4 |

The startup already contains the exact four call templates. It must be sent
as the task prompt, not replaced by an extra instruction to read its path.
Each template preserves the outer and inner 20,000-token output budgets,
`login:false`, exact cwd and ordered manifest/batch reads. The existing batch
limit remains 20,000 encoded bytes; it is not a token-limit guarantee.

Local native `/bin/cat` replay matches every expected output and reconstructs
all nine files. This proves local packaging and byte reconstruction only, not
model-visible delivery, enforced isolation or semantic acceptance.

| Identity | SHA-256 |
| --- | --- |
| Unchanged format-only candidate manifest | `61460297bc2bb429e046ae8bcfe0dc5b762a8171d80a4e5c3dcaa31a2c6e4298` |
| New LF-D-002 material freeze | `1b6fc4cc1ac75a1b9b8a46d591478287d40fb779c132caa8f15e912e534b0dee` |
| Evaluator-only authored report | `7d97c499842a3f1c5d06ebf635601b3a5af4ff7d4936aae9034833c7b13e6a8c` |

The frozen root is
`.local-evaluation/ledger-format-deep-findings-01/materials/`. Native receipts,
test results and preparation receipts are siblings outside that root. Future
runtime results must also remain outside it.

## Validation And Limits

**165/165 tests pass across four suites**, including 37 new case/source/report/
freeze tests, 12 existing format-candidate tests, 18 batch tests and 98 public
profile tests. The new suite also rejects altered payloads, controls, startup,
candidate bytes, missing/extra/reordered/truncated returns, wrong digests,
overwrite and output aliases into protected input trees. All 99 retained
historical/report/helper/formal-source hashes match; the installed symlink still
points to formal v0.6.0.

The new fixture files are in
`evaluation/prototypes/ledger-format-deep-findings/`; the additive preparer is
`evaluation/prototypes/prepare-ledger-format-deep-findings.mjs` and its focused
suite is `tests/ledger-format-deep-findings.test.ts`. No formal Skill, old
preparer, parser or prior report was edited. The full test suite was not rerun
for this isolated evaluation addition.

This case does not accept File Coverage, Fix, other clients, discovery,
installation, general accuracy or cost improvements. It does not replace the
failed Stable/Candidate pair. `runtimeReady=false` and historical No-Go
decisions remain unchanged.

## Dispatch Preflight

2026-10-20: the additive LF-D-002 dispatch entry is **Offline Pass - Unclaimed -
Not Run**. The preparation preserves the exact frozen startup as the task
prompt, with no fifth startup-file read or evaluator-answer append. Its target
is one projectless Codex Desktop task explicitly requesting
`gpt-6-astra / xhigh`.

The current local config selects `custom`, `https://t.kxmeet.com` and the
`responses` wire API. Its default model is `gpt-6.1-sol` with `xhigh`; the task
request explicitly overrides the model. Only these non-secret route fields are
recorded. This is local configuration evidence, not proof of the actual Desktop
route or upstream model; those still require post-dispatch receipts.

The new entry is
`evaluation/prototypes/prepare-ledger-format-deep-findings-dispatch.mjs`.
The historical dispatch scripts remain unchanged. Before claim, it rechecks
the frozen materials, candidate, recipes, route/default metadata and byte-exact
request. It rejects protected output locations, aliases, changed receipts and
unexpected result files. Claim uses exclusive creation and remains consumed
without a successful task-creation receipt. It never invokes a model itself;
the caller must obtain explicit creation authorization and send the returned
request unchanged. This is a one-use local dispatch guard, not OS isolation or
a global prevention of manually creating another task.

**66/66 tests pass across two suites:** 29 new dispatch checks and the existing
37 LF-D-002 checks. Synthetic configs test secret exclusion, invalid TOML,
route/model/effort drift, prompt/material changes, output overlap, stale recipe
pins and repeat claims. The tests use fresh local fixtures, not personal
credentials or retained runtime reports. All 99 protected history/formal hashes
still match; the installed Skill symlink still points to formal v0.6.0.

The unclaimed directory is
`.local-evaluation/ledger-format-deep-findings-01/dispatch-01/`, containing only
`preflight.json` and `request.json`. Preflight SHA-256:
`fa667d72b39568a541b59e1b9a1b381ec19064bb68220e167bfdedb796299173`.
The parent `dispatch-preparation-receipt.json` pins the new helper, tests and
local preparation runner. `dispatch-vitest-attempt-02.json` is the final test
record; the earlier passing run is retained. No claim, task creation, model
request, source transmission or results directory has been created.

## Prepared Execution Gate

Obtain explicit authorization to create one independent Codex Desktop Deep
task with `gpt-6-astra / xhigh` and these public materials only. Then verify and
claim `dispatch-01` once, using the pinned preflight digest, and pass the returned
request to task creation without rewriting its prompt. The startup, manifest
and three batches encoding nine evidence files total 60,426 delivered content bytes.
The runtime proposal is one attempt, no automatic retry and the unchanged
900,000 ms Deep acceptance ceiling. Automatic cancellation is not claimed.

After execution, assess the original full report, complete tool receipts and
source boundaries against the pre-frozen oracle. Preserve grouped-outcome
Not Exercised status where applicable; do not edit reports, relax rules or
repeat a passing case to collect another result. This fixture provides no
matched efficiency control or promotion authorization.

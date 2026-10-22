# File Coverage Deep Dispatch Guard

2026-10-19: **Offline Pass; fresh Candidate window prepared, unclaimed and
Not Run.** The local dispatch entry now generates the exact `create_thread`
arguments from the frozen prompt, rechecks configuration and material identity,
and reserves each dispatch receipt once. The
[previous twenty-call No-Go](large-diff-file-coverage-ledger-dedup-deep-runtime.md)
is retained. No model task, network request, credential read or Skill change
occurred in this step.

Subsequent result: the separately authorized
[Candidate Deep pilot passes](large-diff-file-coverage-ledger-dedup-deep-replacement-runtime.md)
with nineteen exact calls, both validators and eight manual checks. Stable is
Not Run. The preparation and unclaimed-state statements below retain their
original pre-execution meaning; the claim and runtime evidence are separate.

## Change And Scope

The additive evaluator module
`evaluation/prototypes/prepare-file-coverage-deep-dispatch.mjs` reuses the
unchanged Deep preparation verifier. It supports only the current FC-D-001
Candidate stage and exposes three local operations:

| Operation | Behavior |
| --- | --- |
| `prepareFileCoverageDeepDispatch` | Verifies all material pins, generates a request whose prompt is the exact frozen UTF-8 text, records route metadata and independent digests in a new output directory. |
| `verifyFileCoverageDeepDispatch` | Rechecks the independent receipt digest, module identity, current configuration, full frozen tree and exact request; performs no writes. |
| `claimFileCoverageDeepDispatch` | Performs the same checks, creates an exclusive claim receipt, then returns the exact request object for the task tool. A second claim is rejected. |

The generated request fixes `target.type=projectless`, `model=gpt-6-astra` and
`thinking=xhigh`. Do not turn its prompt into a filename or add a new instruction
to read `candidate-dispatch.md`. Pass the returned object directly to
`create_thread` only after explicit authorization. If task creation fails or
its outcome is unknown, preserve the claim and investigate; do not retry.

Configuration inspection uses Python 3.11+ standard-library `tomllib` with
isolated interpreter mode. It returns only provider, base URL, wire API and
configured model/effort fields. Missing/invalid TOML, an active profile,
unexpected provider/URL, unsupported wire API, URL credentials/query, and later
configuration changes are rejected. Credential files are not read, raw TOML is
not returned, and no package installation or PyYAML is needed. This Python
requirement belongs to the evaluator utility, not ordinary Skill use.

Dispatch artifacts must be outside material, candidate, historical-parent,
formal Skill and config roots. Canonical parent paths also reject symlink
aliases. Existing outputs are never overwritten. Reports and tool captures
belong in the dispatch directory's `results/` child, which is outside the
frozen material tree. Preparation does not create that child or claim the run.

These checks protect this local entry and receipt; they do not intercept manual
tool calls or form a global registry of all possible dispatches. Local config is
not attestation of the live Desktop route, provider upstream model or billing.
The actual reviewer trace must still pass all nineteen-call and read-only
checks. Prompt restrictions do not enforce filesystem isolation, and automatic
deadline cancellation remains unavailable.

## Verification

**49/49 tests pass across three suites**: the new dispatch tests, existing
ledger Deep preparation and reference deduplication tests. Tests use generated
public fixtures and synthetic config, never the user's credentials or service.
They exercise exact prompt retention, explicit model/target parameters, two
output budgets through the existing preparation suite, route/config drift,
request rewriting, source/dispatch drift, extra reports, symlink aliases,
output overlap, digest tampering and one-use claims. Rejected inputs do not
create or claim a dispatch. Secret sentinels are absent from artifacts and
returned errors. No new dependency was installed.

The initial 48-test pass used a version-specific Python executable name. The
final utility defaults to `python3` with a standard-library capability check;
an additional invalid-URL rejection brings the final total to 49. The full
repository suite was not rerun for this isolated evaluator addition.

The actual new material directory and unclaimed dispatch receipt both pass
local verification. Current config records `custom`, `https://t.kxmeet.com`,
`responses`, default `gpt-6.1-sol / xhigh`; the prepared request deliberately
sets the previously planned `gpt-6-astra / xhigh` override. Configuration is read
again at claim time, rather than treating this preparation snapshot as fresh
dispatch evidence.

## Fresh Window

| Item | Frozen value |
| --- | --- |
| Materials | `/private/tmp/fe-file-coverage-ledger-dedup-deep-02-20261019` |
| Material freeze SHA-256 | `4ca35a745d5a81dcc72c3cf39b8d0a3aae2dd64840218ae59ea947452790d684` |
| Candidate manifest SHA-256 | `07e4d22fa9c8d6a3bcee161486bc581aac77097245f175c4f7567b6983b59f64` |
| Dispatch directory | `.local-evaluation/file-coverage-ledger-dedup-01/dispatch-02` |
| Preflight SHA-256 | `67cee1fe310c9adb9bf4028302f13b3b51a3ba09328b7fc0ac77fae19477b74c` |
| Prompt SHA-256 | `2c3450963b9957c427f83384d46cbcc1b8f72305711471b5f478c539039a9294` |
| Prompt bytes / expected calls / evidence files | 708 / 19 / 9 |
| Request model / effort | `gpt-6-astra / xhigh` |
| Execution state | Unclaimed; Candidate and Stable Not Run; model invocations 0 |

The public packet, candidate bytes, oracle and acceptance rules are unchanged.
The historical builder still records its inherited plan label/date; the new
root, hashes and separate preparation receipt identify this fresh window.
Reusing the builder does not reuse the consumed model-run authorization.

The reproducible local preparation and result are retained in
`.local-evaluation/file-coverage-ledger-dedup-01/prepare-dispatch-02.mjs` and
`dispatch-02-preparation-receipt.json`. Historical freeze, unedited report,
completion/adjudication records and formal core retain their prior hashes; the
installed Skill still resolves to the formal repository directory. The old
extra report in the failed material root remains untouched.

## Next Gate

Obtain new authorization for one independent Candidate Deep task using these
exact materials. Immediately before creation, claim the pinned receipt and
pass its returned request object unchanged to the task tool. Save the tool
result outside the material root, then assess the complete actual trace and
unedited report. Stable remains withheld until Candidate acceptance and its
own authorization. No automatic retry, promotion, installation, commit, push,
tag or release follows from this offline preparation. Formal v0.6.0 and
`runtimeReady=false` remain unchanged.

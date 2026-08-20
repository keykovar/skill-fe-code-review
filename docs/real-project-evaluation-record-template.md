# Real-project Evaluation Record

Use one copy of this template per model run. Keep evaluator-only expectations and private evidence outside the model-readable workspace.

## Record Metadata

- Case ID: `[fill]`
- Record status: `Draft | Completed | Adjudicated`
- Evaluation date: `[YYYY-MM-DD]`
- Evaluator: `[fill]`
- Mode: `Quick | Deep | Fix`
- Result: `Pass | Fail | Cannot Verify`
- Related case or Fix chain: `[fill or none]`

## Authorization And Privacy

- Repository visibility: `Public | Private | Sanitized fixture`
- Repository identifier used in the public report: `[fill]`
- External model transmission authorized: `Yes | No | Not applicable`
- Authorized client/provider and paths: `[fill]`
- Forbidden data: `[credentials, user data, production payloads, private paths, or other limits]`
- Raw output/trace storage location: `[authorized local path or none]`
- Redaction applied: `[fill]`

## Repository And Scope

- Repository revision: `[commit or sanitized identifier]`
- Comparison baseline: `[commit, branch range, or unavailable with reason]`
- Target: `[working tree, staged diff, commit, branch, or PR]`
- Intended submit scope: `[fill]`
- Modified files: `[fill]`
- Staged files: `[fill]`
- Unstaged files: `[fill]`
- Untracked files: `[fill]`
- Generated/deferred/excluded files: `[fill]`
- Repository instructions applied: `[AGENTS.md, client rule, or none]`
- CodeGraph status: `Used | Not indexed | Not applicable | Cannot Verify`

## Project Context

- Framework: `React | Vue | Other`
- Language: `TypeScript | JavaScript | Mixed`
- Application type: `Web | Hybrid/WebView | Library | Other`
- State/data-flow technology: `[fill or none]`
- Runtime or platform boundary: `[browser, WebView, Native bridge, backend, none]`
- Requirement, bug, or owner-contract evidence: `[reference without private payload]`

## Run Configuration

- Skill revision or content hash: `[fill]`
- Client and version: `[fill]`
- Model/provider shown by client: `[fill or not observable]`
- User-level Memory/plugins/rules loaded: `[fill or unknown]`
- Codex plugin isolation: `[features.plugins=false and features.remote_plugin=false | not applicable | unknown]`
- Source-free client-isolation probe: `Pass | Fail | Not applicable | Not run`
- Disclosed network destinations and observed startup destinations: `[fill]`
- Exact prompt:

```text
[fill]
```

- Allowed validation commands: `[fill]`
- Commands actually run: `[fill]`
- Context collector required: `Yes | No`
- Context collector calls: `[n or trace unavailable]`
- Equivalent Git inventory rereads: `[none, commands, or trace unavailable]`
- Skipped checks and reasons: `[fill]`
- Browser evidence applicable: `Yes | No`
- Browser applicability reason: `[fill]`
- Browser artifact output directory: `[evaluator-owned path outside review workspace or not applicable]`

## Evaluator-only Expectations

Do not place this section in the model prompt or readable review workspace.

### Required Findings

| Expectation ID | Trigger and material impact | Accepted severity | Evidence source | Mode required |
| --- | --- | --- | --- | --- |
| `[E-01]` | `[fill]` | `Blocking | Risk | Improve` | `[fill]` | `Quick | Deep | Fix` |

### Forbidden Or Unsupported Findings

| Expectation ID | Claim that must not be made | Reason |
| --- | --- | --- |
| `[F-01]` | `[fill]` | `[fill]` |

### Expected Behavior And Design

- Material before/after behavior: `[fill]`
- Expected design decision: `Keep | Simplify | Extract | Redesign | Cannot Verify`
- Required retained fallback or compatibility behavior: `[fill or none]`
- Expected recommendation range: `[fill]`

## Pre-run Integrity

- Git status:

```text
[fill]
```

- Relevant file hashes: `[fill or authorized local artifact]`
- Existing unrelated changes: `[fill or none]`
- Trace capture enabled: `Yes | No | Unsupported`
- Trace adapter: `[fill or none]`
- Predeclared MCP tools: `[exact server/tool pairs or none]`
- Frozen Git status artifact: `[authorized evaluator-owned path or none]`

## AI Output Summary

- Overall conclusion: `[fill]`
- Final recommendation: `[fill]`
- Reported finding count by severity: `Blocking [n], Risk [n], Improve [n]`
- Design decision: `Keep | Simplify | Extract | Redesign | Cannot Verify`
- Runtime claims: `[fill]`
- Raw response artifact: `[authorized local path, sanitized attachment, or inline below]`

## Finding Adjudication

Assign exactly one adjudication to every reported finding: `Valid`, `False Positive`, or `Cannot Verify`.

| Output ref | Reported severity | Adjudication | Accepted severity | Severity correct | In scope | Duplicate | Evidence | Suggested fix feasible |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `[title/file:line]` | `[fill]` | `Valid | False Positive | Cannot Verify` | `[fill or n/a]` | `Yes | No | n/a` | `Yes | No` | `Yes | No` | `[fill]` | `Yes | No | Cannot Verify` |

For every `False Positive`, state whether the cause was an invented contract, unread caller, unsupported external semantics, preference-only advice, duplicated issue, stale baseline, scope expansion, or another concrete reason.

## Required-finding Recall

| Expectation ID | Detected | Output ref | Trigger and impact matched | Severity accepted | Notes |
| --- | --- | --- | --- | --- | --- |
| `[E-01]` | `Yes | No` | `[fill or none]` | `Yes | No` | `Yes | No` | `[fill]` |

## Output-contract Verification

| Check | Result | Evidence or deviation |
| --- | --- | --- |
| Requested scope and baseline are explicit | `Pass | Fail | Cannot Verify` | `[fill]` |
| Modified, staged, unstaged, and untracked files are reported | `Pass | Fail | Cannot Verify` | `[fill]` |
| Applicable localized headings are stable | `Pass | Fail` | `[fill]` |
| Conclusion and final recommendation agree | `Pass | Fail` | `[fill]` |
| `Design / Simplify` is evidence-backed | `Pass | Fail | Cannot Verify` | `[fill]` |
| Naming/readability and module-boundary sections avoid duplicate findings | `Pass | Fail` | `[fill]` |
| Validation commands and skipped checks are explicit | `Pass | Fail` | `[fill]` |
| Static and runtime evidence are separated | `Pass | Fail` | `[fill]` |
| `Cannot Verify` is used instead of unsupported certainty | `Pass | Fail | Not applicable` | `[fill]` |

## Fix Review Verification

Complete only for Fix Review.

| Previous finding | Original severity | AI closure status | Adjudicated status | Evidence | Correct |
| --- | --- | --- | --- | --- | --- |
| `[finding ref]` | `[fill]` | `Resolved | Partially Resolved | Unresolved | Cannot Verify` | `[fill]` | `[fill]` | `Yes | No` |

- Every previous finding mapped exactly once: `Yes | No`
- Material New Regression reported separately: `Yes | No | None exists | Cannot Verify`
- Unrelated Deep Review expansion: `Yes | No`
- Closure counts and recommendation agree: `Yes | No`

## Browser Or Runtime Evidence

- Environment and URL type: `[fill or not applicable]`
- Entry point and controlled initial state: `[fill]`
- Browser and viewport: `[fill]`
- Expected observation: `[fill]`
- Observed result: `[fill]`
- Redacted console/network summary: `[fill]`
- Evidence limit: `[browser only, not WebView/Native/backend/production, or other limit]`
- Reason skipped: `[fill or not applicable]`

## Post-run Integrity

- Git status unchanged: `Yes | No | Cannot Verify`
- Relevant file hashes unchanged: `Yes | No | Cannot Verify`
- Client-generated workspace artifacts: `None | Detected and cleaned | Detected and retained | Cannot Verify`
- Write/edit/delete tool request: `None | Detected | Trace unavailable`
- Dependency install, formatter, branch change, commit, or push: `None | Detected | Cannot Verify`
- Oracle or unauthorized-path read: `None | Detected | Trace unavailable`
- Context collector execution contract: `Pass | Fail | Not applicable | Trace unavailable`
- Trace audit result: `Pass | Fail | Unsupported | Not captured`
- Client network-isolation: `Pass | Fail | Cannot Verify | Not applicable`
- MCP calls and failures: `[completed/failed counts or unsupported]`
- Integrity evidence: `[fill]`

## Metrics

Record numerator and denominator, not only percentages.

| Metric | Value |
| --- | --- |
| Required-finding recall | `[detected / required = %]` |
| Finding precision | `[valid / (valid + false positive) = %]` |
| False Blocking | `[n]` |
| Severity accuracy | `[accepted / adjudicated valid = %]` |
| Suggested-fix quality | `[root-cause and behavior-preserving fixes / valid findings with a proposed fix = %]` |
| Minimal-design accuracy | `[supported decisions / adjudicated design decisions = %]` |
| Recommendation consistency | `Pass | Fail` |
| Output-contract compliance | `[passed applicable checks / applicable checks = %]` |
| Read-only violations | `[n]` |
| Scope or oracle violations | `[n]` |
| Fix closure accuracy | `[correct / previous findings = % or n/a]` |
| Fix scope expansion | `Yes | No | n/a` |
| Elapsed seconds | `[fill or unavailable]` |
| Input tokens | `[fill or unavailable; not Skill-attributable by itself]` |
| Cached input tokens | `[fill or unavailable]` |
| Uncached input tokens | `[input minus cached input, or unavailable]` |
| Output tokens | `[fill or unavailable]` |
| Reasoning output tokens | `[fill or unavailable]` |
| Command executions | `[fill or unsupported]` |
| MCP calls and failures | `[fill or unsupported]` |
| Final response characters and lines | `[fill or unavailable]` |
| Retries | `[fill]` |
| Quality and safety comparison summary | `[recall/precision/severity/closure/recommendation/output/read-only summary]` |

## Final Disposition

- Zero-tolerance gates passed: `Yes | No`
- Threshold gates passed: `Yes | No | Insufficient sample`
- Case result: `Pass | Fail | Cannot Verify`
- Failed gates: `[fill or none]`
- Root cause category: `Skill | Client | Model/provider | Repository evidence | Evaluation setup | None`
- Proposed action: `No change | Skill change candidate | Client investigation | Fixture/test change | Rerun required`
- Affected cases that must be rerun after a change: `[fill or none]`
- Residual limitations: `[fill]`

# Post-v0.4.0 Ledger Reconciliation Design

Status: Candidate 03 `No-Go`; Stage 1 stopped after invalid D-ID-001 RUN-01; rolled back to stable v0.4.0

Date: 2026-08-27

## Scope

This document records the offline diagnosis and the resulting Candidate 03 implementation boundary. The offline phase did not modify the stable v0.4.0 Skill or validator and authorized no model request or source transfer. Candidate 03 now changes only the documented Quick/Deep grouped-ledger contract and evaluator validator; it still authorizes no external request, retry, release, commit, or push.

## Evidence

The current flat ledger stores a semantic merge key redundantly on every line that references the same Finding ID. The same representation has failed in multiple exact-candidate windows:

| Evidence | Semantic result | Structural result | Relevant observation |
| --- | --- | --- | --- |
| v0.4.0 Candidate 05 `D-ID-001` | Pass | Fail | Two entries referenced `F-001`; only the second carried the merge key |
| v0.4.0 Candidate 06 `D-ID-001` | Finding recall passed | Fail | Both entries omitted the merge key |
| v0.4.0 Candidate 07 `Q-ID-001 RUN-02` | Fail | Pass | Identical keys were present, but two independently repairable contracts were merged |
| v0.4.0 Candidate 08 | Pass | Pass | The stable release proved that the flat contract can work, not that it is structurally reliable |
| Post-v0.4.0 Candidate 01 | Fail | Fail | One Finding was omitted, so the repeated-ID target was not exercised |
| Post-v0.4.0 Candidate 02 `Q-ID-001 RUN-01` | Pass | Fail | `F-003` had two entries; only the second carried `base-url-contract` |

The evidence supports three bounded conclusions:

1. Repeating one merge key across multiple flat entries is a denormalized output shape with a recurring omission mode.
2. A matching key proves only structural consistency. Candidate 07 shows that it does not prove semantic inseparability.
3. Adding words such as `must`, `every`, or `mechanically` cannot turn model rendering into a deterministic post-processing pass.

This evidence does not prove that every Prompt-only approach will fail or that Candidate 02 wording caused the observed output.

## Options

| Option | Decision | Reason |
| --- | --- | --- |
| Add another tally sentence | Reject | Candidate 01 and 02 already tested this direction; more duplicated instruction raises tokens without changing ownership |
| Keep the flat ledger and run a second model repair | Reject | Adds latency, tokens, privacy surface, retry semantics, and client interception requirements; it still cannot verify semantic merge validity without an oracle |
| Propagate an existing key with a deterministic normalizer | Reject as runtime architecture | It can repair only asymmetric omission, cannot invent a missing semantic basis, and cannot safely split an invalid merge; chat-response interception is not uniform across clients |
| Remove merge evidence | Reject | The evaluator would lose visible evidence for why multiple changed conditions map to one Finding |
| Group conditions under one Finding-owned merge basis | Select for offline prototype | Stores the basis once at its natural owner, removes per-entry duplication, and keeps semantic validity independently scorable |

## Selected Shape

Quick and Deep retain one `Changed-Condition Coverage` section and represent each disposition as one group:

```md
## Changed-Condition Coverage：变更条件覆盖

- [F-001]
  - [src/url.ts:1] 模块依赖：无 request-config -> 导入 request-config
- [F-002]
  - 合并依据：同一原子修复必须同时恢复 base 尾斜杠与 path 首斜杠归一化
  - [src/url.ts:4] base 尾斜杠：去除 -> 保留
  - [src/url.ts:4] path 首斜杠：去除 -> 保留
- [F-003]
  - 合并依据：同一公开 base-url 权威来源与参数契约
  - [src/url.ts:3] baseUrl 入参：参与拼接 -> 被忽略
  - [src/url.ts:4] URL 数据源：baseUrl -> requestConfig.apiBaseUrl
- Behavior Preserving：行为保持
  - [src/profile.ts:3] 返回类型：string -> string
- Cannot Verify：无法验证
  - [src/runtime.ts:8] 生产配置来源：旧环境 -> 新环境
```

Candidate ownership rules:

- A final Finding ID appears once as a group header, never once per condition.
- Every child condition retains an explicit location and `before -> after` transition.
- A Finding group with one condition omits `合并依据`.
- A Finding group with two or more conditions contains exactly one non-empty `合并依据`.
- The basis states the one indivisible repair or acceptance result; a broad label, shared file, function, patch, or test is insufficient.
- `Behavior Preserving` and `Cannot Verify` groups never contain a merge basis.
- Fix Review remains unchanged and preserves supplied Finding IDs.

## Deterministic Boundary

A future validator can prove only syntax and referential integrity:

- exactly one coverage section;
- unique group headers;
- sequential Finding groups that reference rendered Findings;
- at least one child condition per group;
- one explicit transition per child;
- exactly one merge basis when a Finding group has multiple children;
- no merge basis on single-child or non-Finding groups.

It cannot prove that the basis is true or that grouped conditions are inseparable. Existing semantic oracles and the two-counterfactual acceptance test remain mandatory. No normalizer may add a basis, combine groups, split a Finding, renumber semantic concepts, or convert a structurally invalid output into a promotion pass.

## Why This Is Smaller

The selected design changes ownership instead of adding another process:

- one model round;
- no orchestrator or second reviewer;
- no output file or hidden repair;
- no new review mode;
- no change to severity, recommendation, read-only, Context7, Playwright, or Fix Review rules;
- one merge basis per Finding rather than repeated text per condition.

It is a public Quick/Deep output-schema change and therefore cannot be shipped as a tooling-only patch. If promoted after evaluation, it belongs in a minor release.

## Prototype Gate

Do not freeze or run another candidate until an offline implementation brief demonstrates all of the following without changing the installed Skill:

1. A grouped-ledger parser and validator contract covers Chinese and English headings, Markdown-linked locations, single/multiple condition groups, non-Finding groups, malformed nesting, missing bases, and extra bases.
2. Saved valid and invalid outputs can be classified without model calls, source transfer, or automatic repair.
3. The Q-ID and D-ID semantic oracles remain able to reject structurally valid but semantically invalid merges.
4. The prospective prompt delta replaces the flat grammar instead of duplicating it and has a frozen word budget.
5. Quick and Deep are affected; Fix, adapters, collector, trace auditor, and client permissions remain unchanged unless separate evidence justifies a change.

Only after these gates pass should a separately named candidate, exact hashes, fresh workspaces, source-free probe, run order, stop rule, and explicit source-bearing authorizations be frozen.

## Prototype Result

The independent evaluator prototype was initially implemented under `evaluation/prototypes/`. Candidate 03 promoted that implementation to [`scripts/grouped-ledger-validator.mjs`](../scripts/grouped-ledger-validator.mjs) and temporarily imported it from the existing review-output validator; no second public validator or normalizer was added. The rollback removed that public-validator import while retaining the evaluator module and saved replay tooling offline.

Targeted validation passed `1 / 1` Vitest file and `14 / 14` tests plus Node syntax and `git diff --check`. The table covers Chinese and English headings, single and multiple condition groups, one Finding-owned basis, non-Finding groups, Markdown-linked locations, malformed nesting, legacy flat entries, merge-basis count errors, transition errors, Finding-set integrity, and saved-case replay.

One explicit boundary test supplies a structurally valid but semantically invalid merge. The prototype accepts its syntax by design; a semantic oracle must still reject the merge. This prevents the parser from being misrepresented as a second code reviewer.

No model call, network request, source transfer, installed-Skill change, or runtime-candidate freeze occurred during the offline prototype phase. Its historical machine-readable evidence is in [`evaluation/prototypes/grouped-ledger-prototype-result.json`](../evaluation/prototypes/grouped-ledger-prototype-result.json).

Seven separately saved synthetic Markdown cases then replayed `7 / 7`: three structurally valid cases were accepted and four structurally invalid cases returned their exact expected error sets. The structurally valid semantic-merge failure remained marked for semantic-oracle rejection rather than being repaired or reclassified. See the [saved-case replay result](../evaluation/prototypes/grouped-ledger-replay-result.json).

The [Grouped Ledger Migration Brief](post-v0.4.0-grouped-ledger-migration-brief.md) froze exact prospective text replacements, expected hashes, a core `+14` and Quick/Deep combined `+76` English-word delta, validator migration, runtime staging, and rollback rules. Candidate 03 was implemented only after separate authorization.

Offline repository closure validation passed `10 / 10` Vitest files and `126 / 126` tests, saved-case replay and hashes `7 / 7`, both Skill validators, runtime Node syntax `4 / 4`, prototype syntax `2 / 2`, `49 / 49` JSON parses, and `git diff --check`. At that historical boundary, the stable and installed Skill SHA-256 remained `6f1eaba1e61d5f3581713e2814e6fa351fa0bcae68413e02ac1f282565aec286`.

## Candidate 03 Boundary

Post-v0.4.0 Grouped Ledger Candidate 03 implemented the exact prospective prompt and validator migration during its frozen window. Fix, adapters, collector, trace auditor, semantic oracles, read-only rules, and source-transfer policy remained unchanged.

Candidate local closure passed `10 / 10` Vitest files and `127 / 127` tests, replay and saved hashes `7 / 7`, both Skill validators, Node syntax `6 / 6`, JSON parsing `115 / 115`, sensitive-value and diff checks, and installed-candidate/Fix hash verification.

Seven fresh public synthetic workspaces and the isolated Cursor source-free probe passed their complete integrity and isolation gates. The separately authorized public-synthetic `D-ID-001 RUN-01` Deep Review was the first source-bearing gate under the frozen zero-retry order.

That run was invalidated before promotion scoring: shell interpolation expanded the frozen Prompt in the main repository, removed the intended collector command, and injected out-of-scope main-worktree status, tracked diff, and test output into the Cursor request. The returned review observed the expected Finding and valid grouped schema, but the trace had zero collector calls and one equivalent Git inventory command. Candidate 03 is therefore `No-Go`, and all remaining runs stopped. The public Skill, mode references, and review-output validator are restored to stable v0.4.0; the grouped parser, tests, plans, and sanitized results remain evaluator-only evidence. Post-rollback evaluator hardening additionally requires every grouped child to carry a concrete `[file:line]` location and does not change the public validator or Skill.

# Integration-12 Finalization Controls

These are evaluator-only authored excerpts, not model reports, execution observations or complete output templates. Do not include them in reviewer input. The structural validator cannot decide arbitrary natural-language coverage, causality or prerequisite equivalence. The assessments below are manual, source-based checks of the two demonstrated finalization gaps.

## Source Contract

The unchanged public O-05 inputs are in [review-e](pilot-stage-2/inputs/review-e/context.md):

- [before/session.mjs](pilot-stage-2/inputs/review-e/before/session.mjs):4 reads the active token for every entry and returns authentication's result.
- [current/session.mjs](pilot-stage-2/inputs/review-e/current/session.mjs):2,5 captures the creation token and uses it only for `resume=true`.
- [flow.mjs](pilot-stage-2/inputs/review-e/flow.mjs):5,8 accepts the active token with 200, rejects other tokens with 401 and returns the entry result directly.
- The context supports retaining a session across an account change, both Boolean resume values and entry without an account change. Reading the active token is synchronous, available and side-effect-free. No refresh/retry exists in scope.

Static outcome matrix (not executed trials):

| Account changes after creation | Resume | Baseline -> current auth result | Entry/caller result | Assessment |
|---|---|---|---|---|
| No | true | 200 -> 200; cached token is still active | Entry returns 200; the no-change path is contract-supported, not an executed `openAccount` call | Behavior Preserving |
| No | false | 200 -> 200; both read active token | Entry returns 200; same contract limit | Behavior Preserving |
| Yes | true | 200 -> 401; cached token belongs to prior account | `openAccount` returns 200 -> 401, preventing entry | F-001 |
| Yes | false | 200 -> 200; both read active token | `openAccount` returns 200 -> 200 | Behavior Preserving |

The supplied caller itself always changes the account. Do not claim it executed a no-change path. The no-change outcomes follow from the supported contract and session functions. These four combinations are justified by this fixture; they are not a universal row count or permission to enumerate unrelated cases.

## C-01: Explicit Outcomes, Pass

```md
- [current/session.mjs:5] 账号不变且 resume=true 或 resume=false：两条分支认证活动 token 并由 enter 返回 200 -> 缓存 token 仍等于活动 token，两条分支认证并返回 200；Disposition: Behavior Preserving
- [flow.mjs:8] 账号切换后 resume=true：读取活动 token，认证 200 且调用方返回 200 -> 读取旧 token，认证 401 且调用方返回 401，无法进入；Disposition: [F-001]
- [flow.mjs:8] 账号切换后 resume=false：读取活动 token，认证且返回 200 -> 读取活动 token，认证且返回 200；Disposition: Behavior Preserving
```

Manual assessment: Pass for supported outcome coverage. The first row explicitly names both unchanged-account combinations and gives common equality evidence. All four matrix combinations and the direct caller propagation are accounted for. Three rows are sufficient here; splitting the first row into two is also valid. This excerpt alone does not validate the rest of a report.

## C-02: Sources Only, Fail

```md
- [current/session.mjs:5] resume=true：实时 token -> 缓存 token；Disposition: [F-001]
- [current/session.mjs:5] resume=false：实时 token -> 实时 token；Disposition: Behavior Preserving
```

Manual assessment: Fail for supported outcome coverage. Source selection alone omits the account-state combinations, authentication outcomes and propagation. The line grammar can pass while the semantics are incomplete.

## C-03: Planned Tests, Fail

```md
## Test Gaps

Test unchanged account, changed account with resume=true, and changed account with resume=false.
```

Manual assessment: Fail as a substitute for before/after comparison. A future test plan neither states each supported outcome nor proves execution. The unchanged-account phrase also leaves its two resume values implicit.

## C-04: Matching Required Conditions, Pass

```md
## 总体结论

修改后可以进入下一步。前置条件：修复 F-001，使进入时读取活动 token；通过上述四个支持组合的认证结果与直接调用方返回值回归验证。

## 最终建议

修改后可以进入下一步。前置条件：修复 F-001，使进入时读取活动 token；通过上述四个支持组合的认证结果与直接调用方返回值回归验证。
```

Manual assessment: Pass for recommendation consistency. Both sections name the same bounded repair and verification gate. The tests are required future work in this illustration, not an Observed result. Real reviews derive gates from their evidence and user criteria, not this example.

## C-05: Same Label, Different Conditions, Fail

```md
## Overall Conclusion

Fix before next step: restore the active-token read for F-001.

## Final Recommendation

Fix before next step. With the same prerequisites, restore the active-token read for F-001 and pass the supported-combination regression checks.
```

Manual assessment: Fail. The final recommendation adds a verification gate absent from the conclusion. Saying "same prerequisites" cannot establish equivalence. This mirrors the original Deep failure without editing that report.

## C-06: Missing Required Repair, Fail

```md
## Overall Conclusion

Fix before next step: repair F-001 and pass the affected regression checks.

## Final Recommendation

Fix before next step: pass the affected regression checks.
```

Manual assessment: Fail. Comparing in both directions finds the required repair omitted from the ending; matching recommendation labels is insufficient.

## C-07: Optional Work Is Not A Gate, Pass

Authored Quick no-finding counterexample, independent of the O-05 source defect:

```md
## Overall Conclusion

Can submit. Prerequisites: none. Optional additional browser testing is not a submission condition; browser execution was not required by the inspected contract.

## Final Recommendation

Can submit. Prerequisites: none. The optional browser check remains non-blocking.
```

Manual assessment: Pass for consistency only. `Not Run` does not automatically create a gate. This says nothing about whether an arbitrary real change is defect-free.

## C-08: Invented Mandatory Check, Fail

Take C-07 and replace the final recommendation with `Can submit, but only after the browser test passes.`

Manual assessment: Fail. This both changes the prerequisite set and invents a mandatory gate without evidence. Do not "repair" consistency by copying an unsupported gate into both sections.

## Acceptance Boundary

Eight manual controls: C-01/C-04/C-07 have the illustrated property; C-02/C-03/C-05/C-06/C-08 do not. These are not eight model trials or eight new automated semantic tests. The integration-11 O-05 report remains No-Go with two manual failures even when integration-12 accepts its empty-marker presentation. Before a changed candidate can be accepted, its fresh report must satisfy the unchanged source contract and full-report assessment; no parser Pass can replace that judgment.

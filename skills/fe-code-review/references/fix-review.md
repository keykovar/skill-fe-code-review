# Fix Review

Load this file when reviewing code changed in response to an earlier review.

Use the previous findings as the acceptance baseline. Inspect the fix diff, verify each finding against current code and relevant call paths, then check whether the fix introduces new regressions. Do not claim closure from code shape alone when runtime verification was required.

Apply the Quick/Fix evidence discipline in `SKILL.md`. Use this focused sequence: map every previous finding to its original trigger and acceptance criteria; inspect the fix diff; inspect the direct callers, consumers, contracts, and tests needed to exercise that trigger; compare the repaired path with adjacent behavior that must remain unchanged; then scan only those affected paths for regressions introduced by the fix. Do not inventory unrelated source trees, dependencies, routes, or architecture merely because they are available.

When a previous finding or its acceptance criteria require browser runtime evidence, apply the conditional browser evidence gate in `SKILL.md` and reuse the original reproduction environment, initial state, steps, and observable assertions. Exercise the directly affected regression path only when evidence justifies it. If any original element is unavailable or cannot be reproduced equivalently, use `Cannot Verify`; do not substitute a different environment, state, steps, or assertions and claim the finding is `Resolved`.

Stay in Fix Review and keep its focused template and verification budget. If the fix changes architecture or exposes broader risk, inspect only the affected architecture needed to decide finding closure and detect fix regressions. Recommend a separate Deep Review with an explicit scope; do not silently switch modes or add a Deep Review audit to this output.

Use every top-level section exactly once. Preserve each previous finding's severity and assign exactly one status: Resolved, Partially Resolved, Unresolved, or Cannot Verify.

Apply the Fix Review recommendation matrix in `SKILL.md`. The conclusion counts, per-finding statuses, New Regression section, and final recommendation must describe the same closure state.

## Chinese Output Template

```md
## 回审结论

回审建议：可以关闭 / 修改后再次回审 / 暂时无法确认

- 已解决：
- 部分解决：
- 未解决：
- 无法验证：
- 新增回归：

## 回审范围

- 请求范围：
- 上次审查基线：
- 原始变更范围：
- 本次修复范围：
- 比较基线：
- 涉及文件与调用链：
- 已修改：
- 已暂存：
- 未暂存：
- 未跟踪：
- 已执行验证：
- 跳过的验证：

## Issue Verification：问题验证

- [原 finding / file:line] 问题标题
  - 原严重级别：Blocking / Risk / Improve
  - 当前状态：Resolved：已解决 / Partially Resolved：部分解决 / Unresolved：未解决 / Cannot Verify：无法验证
  - 修复前行为：
  - 修复后行为：
  - 当前证据：
  - 剩余风险：
  - 验证结果：

## New Regression：新增回归

### Blocking：必须修改

- [file:line] 问题标题
  - 触发场景：
  - 影响：
  - 根因：
  - 建议方案：
  - 验证方式：

### Risk：建议修改

- [file:line] 问题标题
  - 触发场景：
  - 影响：
  - 根因：
  - 建议方案：
  - 验证方式：

### Improve：可优化

- [file:line] 问题标题
  - 优化建议：

## Behavior Delta：行为差异

- 预期修复：
- 实际变化：
- 应保持不变的行为：
- 意外变化或缺失：

## Test Gaps：测试缺口

- 原问题复现：
- 修复验证：
- 回归测试：
- 运行时 / 监控验证：

## Evidence：证据

- 上次问题清单：
- fix diff：
- 本地代码与调用链：
- package/version：
- 官方文档核验：
- 浏览器运行证据：
- 未验证：

## 最终建议

复述同一回审建议，明确哪些问题可以关闭、哪些仍需处理，以及是否需要再次回审；不得与状态统计或 New Regression 结论冲突。
```

## English Output Template

Mirror the Chinese structure with these headings: `Review Conclusion`, `Review Scope`, `Issue Verification`, `New Regression`, `Behavior Delta`, `Test Gaps`, `Evidence`, and `Final Recommendation`. `Review Scope` must include the requested scope, modified, staged, unstaged, and untracked files, and executed and skipped validation. Preserve original severities and use exactly one closure status per previous finding. Under `Evidence`, distinguish permitted official documentation verification, browser runtime evidence, and unverified areas.

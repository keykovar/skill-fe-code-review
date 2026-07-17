# Fix Review

Load this file when reviewing code changed in response to an earlier review.

Use the previous findings as the acceptance baseline. Inspect the fix diff, verify each finding against current code and relevant call paths, then check whether the fix introduces new regressions. Do not claim closure from code shape alone when runtime verification was required.

Use every top-level section exactly once. Preserve each previous finding's severity and assign exactly one status: Resolved, Partially Resolved, Unresolved, or Cannot Verify.

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

- 上次审查基线：
- 原始变更范围：
- 本次修复范围：
- 比较基线：
- 涉及文件与调用链：
- 已执行验证：
- 未验证项：

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
- 官方文档 / Context7：
- 未验证：

## 最终建议

明确说明哪些问题可以关闭、哪些仍需处理，以及是否需要再次回审。
```

## English Output Template

Mirror the Chinese structure with these headings: `Review Conclusion`, `Review Scope`, `Issue Verification`, `New Regression`, `Behavior Delta`, `Test Gaps`, `Evidence`, and `Final Recommendation`. Preserve original severities and use exactly one closure status per previous finding.

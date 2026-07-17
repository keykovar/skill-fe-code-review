# Quick Review

Load this file for daily changes, small PRs, bug fixes, local refactors, and normal uncommitted diffs.

Focus on functional correctness, behavior loss, edge cases, async/state/cache consistency, regression risk, React/Vue lifecycle issues, TypeScript/runtime contracts, naming clarity, file placement, unnecessary complexity, and missing minimal tests.

Use every top-level section exactly once. Write `无明确问题。` or `No clear issue.` when a finding section is empty.

## Chinese Output Template

```md
## 总体结论

提交建议：可以提交 / 修改后提交 / 不建议提交

一句话说明主要风险。

## 审查范围

- 请求范围：
- 比较基线：
- 已修改：
- 已暂存：
- 未暂存：
- 未跟踪：
- 已执行验证：
- 未验证项：

## Blocking：必须修改

- [file:line] 问题标题
  - 触发场景：
  - 影响：
  - 根因：
  - 建议方案：
  - 验证方式：

## Risk：建议修改

- [file:line] 问题标题
  - 触发场景：
  - 影响：
  - 根因：
  - 建议方案：
  - 验证方式：

## Improve：可优化

- [file:line] 问题标题
  - 当前实现：
  - 优化建议：

## Design / Simplify：设计与简化

- [file:line] 问题
  - 当前实现：
  - 建议方向：
  - 取舍：

## Naming / Readability：命名与可读性

- [file:line] 问题
  - 当前命名：
  - 建议命名：
  - 原因：

## File Placement / Module Boundary：文件存放与模块边界

- [file/path] 问题
  - 当前位置：
  - 建议位置：
  - 原因：

## Test Gaps：测试缺口

- ...

## Evidence：证据

- 修改前后行为：
- 本地代码：
- 调用链：
- package/version：
- 官方文档 / Context7：
- 未验证：

## 最终建议

明确说明提交前必须处理什么。
```

## English Output Template

Mirror the Chinese structure with these headings: `Overall Conclusion`, `Review Scope`, `Blocking`, `Risk`, `Improve`, `Design / Simplify`, `Naming / Readability`, `File Placement / Module Boundary`, `Test Gaps`, `Evidence`, and `Final Recommendation`. Include the comparison baseline and before/after behavior evidence.

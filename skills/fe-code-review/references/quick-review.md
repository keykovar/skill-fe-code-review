# Quick Review

Load this file for daily changes, small PRs, bug fixes, local refactors, and normal uncommitted diffs.

Focus on functional correctness, behavior loss, edge cases, async/state/cache consistency, regression risk, React/Vue lifecycle issues, TypeScript/runtime contracts, naming clarity, file placement, unnecessary complexity, and missing minimal tests.

For `Design / Simplify`, perform a bounded minimal-sufficient-design check over the diff, its immediate owner, and directly affected callers. Report only clear, local, evidence-backed overdesign, semantic duplication, missed reuse, redundant state or process, or unjustified cases and fallbacks. Do not expand Quick Review into an exhaustive repository-wide abstraction audit.

Use one compact decision: `Keep`, `Simplify`, `Extract`, or `Cannot Verify`. `Keep` requires supporting local evidence; when the bounded Quick scope cannot establish whether complexity is justified, use `Cannot Verify` and state the missing evidence. Even when local evidence suggests a structural redesign, Quick scope is too narrow to verify its cross-module blast radius: use `Cannot Verify`, report the evidenced risk, and recommend Deep Review; do not emit `Redesign` in Quick Review. Every `Simplify` or `Extract` decision must cite an actionable issue reported once under its applicable severity section. Do not repeat the full finding in `Design / Simplify`, and do not recommend extraction solely because code looks similar.

Do not start Playwright or other browser automation by default. When the conditional browser evidence gate in `SKILL.md` is satisfied and one browser-observable path would materially affect the submit recommendation, verify at most that one critical path. Otherwise keep the review static and record required runtime evidence as unverified or `Cannot Verify`.

In Quick Review, `Cannot Verify` describes evidence status, not finding severity. Missing runtime or external evidence alone is not a finding. When local static evidence supports a finding, keep its demonstrated Blocking, Risk, or Improve severity and mark only the unverified evidence portion `Cannot Verify`. This does not change the `Design / Simplify` decision vocabulary.

Apply the recommendation matrix in `SKILL.md` after classifying findings. In particular, an Improve-only review uses `可以提交` and describes the improvement as optional and non-blocking; do not add `建议提交前` or another pre-submit condition in the summary or final recommendation.

Use every top-level section exactly once. Write `无明确问题。` or `No clear issue.` when a finding section is empty.

## Chinese Output Template

```md
## 总体结论

提交建议：可以提交 / 修改后提交 / 不建议提交

一句话说明主要风险，并与提交建议保持一致。

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
  - 触发场景：
  - 影响：
  - 根因：
  - 建议方案：

## Design / Simplify：设计与简化

- 结论：Keep / Simplify / Extract / Cannot Verify
- 关联问题：Blocking / Risk / Improve [file:line] / 无
- 最小充分方向 / 保留理由：
- 必须保持的行为 / 约束：
- 证据 / 未验证：

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
- 官方文档核验：
- 浏览器运行证据：
- 未验证：

## 最终建议

复述同一提交建议及其前置条件，不得新增更严格的提交门槛；仅有 Improve 时明确说明优化不影响提交。
```

## English Output Template

Mirror the Chinese structure with these headings: `Overall Conclusion`, `Review Scope`, `Blocking`, `Risk`, `Improve`, `Design / Simplify`, `Naming / Readability`, `File Placement / Module Boundary`, `Test Gaps`, `Evidence`, and `Final Recommendation`. Include the comparison baseline and before/after behavior evidence. In `Design / Simplify`, use a compact `Keep`, `Simplify`, `Extract`, or `Cannot Verify` decision and preserve required behavior or invariants. Under `Evidence`, distinguish permitted official documentation verification, browser runtime evidence, and unverified areas.

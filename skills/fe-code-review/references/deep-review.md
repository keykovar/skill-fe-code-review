# Deep Review

Load this file for large features, risky refactors, release review, cross-module changes, dependency upgrades, or business-critical flows.

Review requirement alignment, change map, before/after behavior, functional correctness, regression risk, framework lifecycle, runtime contracts, API/storage/cache compatibility, performance, browser/WebView compatibility, architecture, naming, file placement, tests, observability, rollout, and rollback.

For `Design / Simplify`, assess the requirements, baseline behavior, affected callers and consumers, existing repository capabilities, abstraction ownership, and runtime contracts. Distinguish semantic duplication from merely similar syntax. Verify whether cases, fallbacks, states, flags, parameters, and extension points have real producers, consumers, recovery needs, or compatibility requirements.

When a simpler viable alternative exists, compare it with the current design and state the correctness, stability, coupling, and maintenance tradeoff. Use `Keep`, `Simplify`, `Extract`, `Redesign`, or `Cannot Verify`; do not manufacture an issue when the current implementation is already the minimal sufficient design.

Every `Simplify`, `Extract`, or `Redesign` decision must cite an actionable issue reported once under its applicable severity section. Do not repeat the full finding in `Design / Simplify`.

When the conditional browser evidence gate in `SKILL.md` is satisfied and browser-observable behavior is material to the review, verify the primary user path and at most one additional high-risk path supported by code, diff, requirement, incident, or test evidence. Do not invent an edge case merely to fill the second path. Record any required WebView, Native, device, backend, deployment, or production validation separately as unverified.

In Deep Review, `Cannot Verify` describes evidence status, not finding severity. Missing runtime or external evidence alone is not a finding. When local static evidence supports a finding, keep its demonstrated Blocking, Risk, or Improve severity and mark only the unverified evidence portion `Cannot Verify`. This does not change the `Design / Simplify` decision vocabulary.

Use every top-level section exactly once. In `Design / Simplify`, use `Keep` when inspected evidence supports the current implementation and no design issue is found; use `Cannot Verify` when evidence is insufficient. In other sections, write `无明确问题。` or `No clear issue.` when no clear issue exists. Do not omit the change map, requirement gaps, design, naming, file placement, release risk, evidence, or final recommendation.

## Chinese Output Template

```md
## 总体结论

合并 / 提交建议：可以进入下一步 / 修改后可以进入下一步 / 暂不建议进入下一步
风险等级：低 / 中 / 高

主要原因：

1. ...
2. ...
3. ...

## 变更理解

- 请求范围：
- 涉及模块：
- 变更类型：
- 影响范围：
- 用户路径：
- 已修改：
- 已暂存：
- 未暂存：
- 未跟踪：
- 已执行验证：
- 跳过的验证：

## Change Map：变更地图

- 比较基线：
- 修改前行为：
- 修改后行为：
- 保持不变的约束：
- 缺失 / 移除行为：
- 入口与核心调用链：
- 共享模块影响：
- 配置 / 依赖影响：

## Findings：问题列表

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
  - 触发场景：
  - 影响：
  - 根因：
  - 建议方案：

## Requirement Gaps：需求缺口

- ...

## Design / Simplify：设计与简化

- 结论：Keep / Simplify / Extract / Redesign / Cannot Verify
- 关联问题：Blocking / Risk / Improve [file:line] / 无
- 当前需求与必须保持的行为：
- 已有能力复用：
- 过度设计 / 冗余流程：
- 语义重复与漂移风险：
- 不必要的 case / fallback / state / parameter：
- 更简单可行方案：
- 稳定性与维护性取舍：
- 证据与未验证假设：

## Naming / Readability：命名与可读性

- ...

## File Placement / Module Boundary：文件存放与模块边界

- ...

## Test Gaps：测试缺口

- 单测：
- 集成测试：
- 手测路径：
- 日志 / 埋点：

## Release Risks：上线风险

- 灰度：
- 回滚：
- 兼容性：
- 监控：

## Evidence：证据

- 本地代码：
- 调用链：
- package/version：
- 官方文档核验：
- 浏览器运行证据：
- 未验证：

## 最终建议

明确说明是否可以进入下一步，以及必须先处理的问题。
```

## English Output Template

Mirror the Chinese structure with these headings: `Overall Conclusion`, `Change Understanding`, `Change Map`, `Findings`, `Requirement Gaps`, `Design / Simplify`, `Naming / Readability`, `File Placement / Module Boundary`, `Test Gaps`, `Release Risks`, `Evidence`, and `Final Recommendation`. `Change Understanding` must include the requested scope, modified, staged, unstaged, and untracked files, and executed and skipped validation. The change map must include the baseline, before behavior, after behavior, preserved invariants, and missing or removed behavior. `Design / Simplify` must include a minimal-sufficient-design decision, existing capability reuse, semantic duplication, unjustified complexity, a simpler viable alternative when one exists, tradeoffs, evidence, and unverified assumptions. Under `Evidence`, distinguish permitted official documentation verification, browser runtime evidence, and unverified areas.

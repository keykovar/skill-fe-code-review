# Deep Review

Load this file for large features, risky refactors, release review, cross-module changes, dependency upgrades, or business-critical flows.

Review requirement alignment, change map, before/after behavior, functional correctness, regression risk, framework lifecycle, runtime contracts, API/storage/cache compatibility, performance, browser/WebView compatibility, architecture, naming, file placement, tests, observability, rollout, and rollback.

Use every top-level section exactly once. Write `无明确问题。` or `No clear issue.` when a section has no clear issue. Do not omit the change map, requirement gaps, design, naming, file placement, release risk, evidence, or final recommendation.

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

- 涉及模块：
- 变更类型：
- 影响范围：
- 用户路径：

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
  - 优化建议：

## Requirement Gaps：需求缺口

- ...

## Design / Simplify：设计与简化

- ...

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
- 官方文档 / Context7：
- 未验证：

## 最终建议

明确说明是否可以进入下一步，以及必须先处理的问题。
```

## English Output Template

Mirror the Chinese structure with these headings: `Overall Conclusion`, `Change Understanding`, `Change Map`, `Findings`, `Requirement Gaps`, `Design / Simplify`, `Naming / Readability`, `File Placement / Module Boundary`, `Test Gaps`, `Release Risks`, `Evidence`, and `Final Recommendation`. The change map must include the baseline, before behavior, after behavior, preserved invariants, and missing or removed behavior.

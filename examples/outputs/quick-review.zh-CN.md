# Quick Review 中文输出示例

```md
## 总体结论

提交建议：修改后提交

当前代码逻辑未发现明确功能缺陷，但提交前必须把被引用的未跟踪文件纳入提交范围，否则干净环境会构建失败。

## 审查范围

- 请求范围：当前未提交代码，Quick Review
- 比较基线：`HEAD` 与当前工作区
- 已修改：`src/themes/lovent/pages/home/store/index.ts`
- 已暂存：无
- 未暂存：1 个文件
- 未跟踪：`src/core/home/types.ts`
- 已执行验证：`pnpm run type-check` 通过
- 未验证项：未做页面运行时手测

## Blocking：必须修改

- [src/themes/lovent/pages/home/store/index.ts:4] 已跟踪文件依赖未跟踪类型文件
  - 触发场景：只提交已跟踪文件，漏掉 `src/core/home/types.ts`
  - 影响：CI 或其他开发者 clean checkout 后无法解析 `@core/home/types`
  - 根因：已有 tracked 文件 import 了仍处于 untracked 状态的新文件
  - 建议方案：提交时包含 `src/core/home/types.ts`，或移除该 import
  - 验证方式：确认 `git status --short` 不再显示 `?? src/core/home/types.ts`，并重新运行 type-check

## Risk：建议修改

无明确问题。

## Improve：可优化

无明确问题。

## Design / Simplify：设计与简化

无明确问题。

## Naming / Readability：命名与可读性

无明确问题。

## File Placement / Module Boundary：文件存放与模块边界

无明确问题。

## Test Gaps：测试缺口

- 未做页面运行时验证。

## Evidence：证据

- 修改前后行为：新增共享类型引用；运行时逻辑未改变，但提交完整性发生变化。
- 本地代码：已检查 import 和 untracked 文件状态。
- 调用链：无新增运行时调用链风险。
- package/version：未涉及依赖变更。
- 官方文档 / Context7：未使用。
- 未验证：页面运行时行为。

## 最终建议

先把 `src/core/home/types.ts` 纳入提交范围，再进入提交步骤。
```

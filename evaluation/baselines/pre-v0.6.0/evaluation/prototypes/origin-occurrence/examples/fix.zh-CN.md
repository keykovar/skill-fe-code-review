## 回审结论

回审建议：修改后再次回审

- 已解决：1
- 部分解决：0
- 未解决：0
- 无法验证：0
- 新增回归：1

## 回审范围

- 请求范围：对上次 F-001 的修复回审
- 上次审查基线：HEAD
- 本次修复范围：session token owner
- F-001 闭环标准：恢复当前 token 来源并通过给定合成 auth contract；真实账号验收不属于本 fixture。
- 已执行验证：静态调用链、合成 auth contract
- 跳过的验证：真实账号和 WebView

## Issue Verification：问题验证

- [F-001] [src/auth/session.ts:44] Resume stale token
  - 原严重级别：Blocking
  - 当前状态：Resolved：已解决
  - 修复前行为：恢复流程读取缓存 token。
  - 修复后行为：恢复流程读取当前 token。
  - 当前证据：合成 auth contract 返回 200。
  - 剩余风险：真实账号环境未验证，不属于给定 fixture 的闭环标准。
  - 验证结果：静态检查和合成 contract 通过。
  - 问题来源：New：原始基线读取当前 token，修复前改动引入缓存 token。
  - 复现观测：[修复前] Observed：已观测；1/1 合成恢复场景失败，证据为修复基线 contract。 | [修复后] Observed：已观测；0/1 等价场景失败，证据为当前 contract。

## New Regression：新增回归

### Blocking

无明确问题。

### Risk

- [F-002] [src/auth/session.ts:51] Fix expands exposure to the existing token cache
  - 触发场景：账号切换后第二个 profile 请求。
  - 影响：两个 session owner 可能产生不一致授权。
  - 根因：修复将新增调用方接入既有共享缓存，而非当前 session owner。
  - 建议方案：删除并行缓存，统一复用当前 owner。
  - 验证方式：执行切换账号的两次请求场景。
  - 问题来源：Amplified：修复基线已有缓存冲突，修复新增调用方扩大可达账号集合。
  - 复现观测：Not Run：未执行账号切换运行验证；静态证据支持暴露面变化。

### Improve

无明确问题。

## Behavior Delta：行为差异

- 预期修复：恢复当前 token。
- 实际变化：F-001 已修复，但新增调用方扩大了既有共享缓存的暴露面。
- 应保持不变的行为：每个账号必须使用当前授权 owner；新增调用方违反了该约束。
- 意外变化或缺失：新增回归 F-002。

## Test Gaps：测试缺口

- 需要账号切换和双请求回归测试。

## Evidence：证据

- 上次问题清单：F-001
- fix diff：`src/auth/session.ts:44-51`
- 未验证：真实账号与 WebView。

## 最终建议

修改后再次回审；处理 F-002 并保持 F-001 已验证的合成 contract。真实账号验收属于独立且尚未验证的范围。

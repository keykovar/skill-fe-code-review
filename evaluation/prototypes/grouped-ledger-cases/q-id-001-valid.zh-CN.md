## Changed-Condition Coverage：变更条件覆盖

- [F-001]
  - [src/url.ts:1] 模块依赖：无 request-config -> 导入 request-config
- [F-002]
  - 合并依据：同一原子修复必须同时恢复 base 与 path 的斜杠归一化
  - [src/url.ts:4] base 尾斜杠：去除 -> 保留
  - [src/url.ts:4] path 首斜杠：去除 -> 保留
- [F-003]
  - 合并依据：同一公开 base-url 权威来源与参数契约
  - [src/url.ts:3] baseUrl 入参：参与拼接 -> 被忽略
  - [src/url.ts:4] URL 数据源：baseUrl -> requestConfig.apiBaseUrl
- Behavior Preserving：行为保持
  - [src/profile.ts:3] 返回类型：string -> string

## Blocking：必须修改

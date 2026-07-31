# Skill FE Code Review

[![CI](https://github.com/keykovar/skill-fe-code-review/actions/workflows/ci.yml/badge.svg)](https://github.com/keykovar/skill-fe-code-review/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/keykovar/skill-fe-code-review)](https://github.com/keykovar/skill-fe-code-review/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[English](README.md) | 简体中文

适用于 Codex、Claude Code 和 Cursor 的可复用前端及 Hybrid 应用代码审查 Skill。

完整工作流集中在一个开放格式 Skill 中：

```text
skills/fe-code-review/SKILL.md
```

## 审查模式

| 模式 | 适用场景 | 主要输出 |
| --- | --- | --- |
| Quick Review | 日常 diff、小型 PR、Bug 修复、局部重构 | 聚焦问题列表与提交建议 |
| Deep Review | 高风险功能、跨模块改动、发布变更、依赖升级 | 变更地图、需求缺口、上线风险与深入证据 |
| Fix Review | 根据上一次审查结果修改后的代码 | 逐项回审状态与新增回归检测 |

所有模式默认只读。Quick 和 Deep Review 会对比修改前后行为。每个 Blocking 或 Risk 问题都应包含触发条件、影响、根因、建议方案和验证方式。

Skill 还会审查设计与简化、命名与可读性、文件存放与模块边界、测试缺口和上线风险。React、Vue、TypeScript、JavaScript、Hybrid/WebView 参考仅在相关时加载。

## 仓库结构

```text
skills/fe-code-review/       核心 Agent Skill
adapters/codex/              Codex 安装说明
adapters/claude-code/        Claude Code 安装说明
adapters/cursor/             Cursor 安装说明与薄规则
docs/                        兼容性、评测、版本规则与路线图
examples/                    指令与输出示例
tests/                       Vitest 结构和契约检查
```

## 安装稳定版本

当前稳定版本为 `v0.2.0`。需要可复现安装时，应固定 Release tag，不要直接安装 `main`。

```bash
git clone --depth 1 --branch v0.2.0 \
  https://github.com/keykovar/skill-fe-code-review.git
cd skill-fe-code-review
```

### Codex

用户级安装：

```bash
mkdir -p "$HOME/.agents/skills"
cp -R "skills/fe-code-review" "$HOME/.agents/skills/"
```

项目级安装：

```bash
mkdir -p "/absolute/path/to/project/.agents/skills"
cp -R "skills/fe-code-review" "/absolute/path/to/project/.agents/skills/"
```

### Claude Code

```bash
mkdir -p "$HOME/.claude/skills"
cp -R "skills/fe-code-review" "$HOME/.claude/skills/"
```

### Cursor

```bash
TARGET_REPO="/absolute/path/to/project"
mkdir -p "$TARGET_REPO/.cursor/skills" "$TARGET_REPO/.cursor/rules"
cp -R "skills/fe-code-review" "$TARGET_REPO/.cursor/skills/"
cp "adapters/cursor/rules/fe-code-review.mdc" \
  "$TARGET_REPO/.cursor/rules/fe-code-review.mdc"
```

如果正在运行的客户端没有立即发现 Skill，请在安装后新建任务或打开新的客户端窗口。升级时应检出新的不可变 tag，再替换旧安装副本。

## 本地开发安装

只有在本地开发 Skill 时才建议使用软链接，使源码修改可以立即生效。

Codex：

```bash
mkdir -p "$HOME/.agents/skills"
ln -s "$(pwd)/skills/fe-code-review" "$HOME/.agents/skills/fe-code-review"
```

Claude Code：

```bash
mkdir -p "$HOME/.claude/skills"
ln -s "$(pwd)/skills/fe-code-review" "$HOME/.claude/skills/fe-code-review"
```

Cursor：

```bash
mkdir -p ".cursor/skills" ".cursor/rules"
ln -s "$(pwd)/skills/fe-code-review" ".cursor/skills/fe-code-review"
cp "adapters/cursor/rules/fe-code-review.mdc" ".cursor/rules/fe-code-review.mdc"
```

## 兼容性

### 稳定版 v0.2.0

| 客户端 | v0.2.0 验证证据 | 状态 |
| --- | --- | --- |
| Codex | Quick、Deep、Fix Review 冒烟及收紧后的回归验证 | 运行时已验证 |
| Cursor Desktop 3.13.25 / CLI 2026.01.23 | Desktop 实测及收紧后的 CLI Improve-only Quick 回归，未写入 fixture | 运行时已验证 |
| Claude Code | 仅完成结构与适配器测试；当前无可用运行时凭据 | `Cannot Verify：无法验证` |

由于当前没有有效的 Claude Code 运行时凭据，Claude Code 明确记录为 `Cannot Verify：无法验证`，不会被描述为运行通过。详细证据和限制见[兼容性说明](docs/compatibility.md)与 [v0.2.0 评测结果](docs/evaluation-results/v0.2.0.md)；历史 v0.1.1 证据仍保留在 [v0.1.1 评测结果](docs/evaluation-results/v0.1.1.md)。

## 使用方式

Quick Review：

```text
使用 fe-code-review，Quick Review 当前未提交代码。只读，不修改代码。
```

Deep Review：

```text
使用 fe-code-review，Deep Review main...HEAD，重点审查回归风险、测试缺口和上线风险。只读。
```

Fix Review：

```text
使用 fe-code-review，Fix Review 当前修改，并对照上一次审查问题逐项验证，同时检查新增回归。只读。
```

命名与结构：

```text
使用 fe-code-review 审查当前 diff 的命名、可读性、文件存放和模块边界。
```

更多示例见[指令示例](examples/prompts.md)。

## 输出结果说明

审查结果是一份面向决策的报告，不只是零散的问题列表。

> [!NOTE]
> 下文的最小充分设计规则、更严格的文档工具合同、条件式浏览器证据、`Cannot Verify：无法验证` 语义、Fix/Deep 模式边界和结论一致性合同均属于稳定版 `v0.2.0`。`v0.1.1` 标签仍保留上一版合同。

| 模式 | 必需输出 |
| --- | --- |
| Quick Review | 总体结论、准确审查范围、按优先级排列的问题、工程质量检查、测试缺口、证据和最终建议 |
| Deep Review | Quick Review 内容，加上变更理解、变更地图、需求缺口、跨模块影响和上线风险 |
| Fix Review | 回审结论、历史问题状态、新增回归、行为差异、剩余测试缺口和关闭建议 |

每份 Quick Review 和 Deep Review 报告应提供：

- 提交或下一步建议。Quick Review 使用 `可以提交`、`修改后提交`、`不建议提交`；Deep Review 使用对应的“进入下一步”表述。
- 比较基线和请求范围，包括已修改、已暂存、未暂存、未跟踪文件。
- 按 `Blocking：必须修改`、`Risk：建议修改`、`Improve：可优化` 分类的问题。
- 每个重要问题的文件与行号、触发条件、影响、根因、建议方案和验证方式。
- 独立的最小充分设计与简化、命名与可读性、文件存放与模块边界检查。
- 测试缺口、本地证据、实际执行的命令、跳过的验证和仍未验证的运行时路径。
- 与未解决 Blocking 和验证边界一致的最终建议。

总体结论和最终建议必须是同一个决策合同。`可以提交` / `可以进入下一步` 要求不存在未解决的 Blocking，也不存在被定义为前置条件的 Risk 或必需验证；出现 Blocking 时至少应使用 `修改后提交`，Risk 必须明确是前置条件还是已接受的剩余风险。只有 Improve 时默认仍可提交或进入下一步，且必须明确“该优化不影响提交”，除非用户在审查前声明了更严格的质量门。最终建议不得临时增加新的提交前或下一步前置条件。

最小充分设计是指只保留当前需求、运行时契约和仓库模式能够证明有必要的复杂度，并不等于代码行数最少。审查会检查过度设计、存在漂移风险的重复业务规则、遗漏复用、冗余状态或流程，以及没有依据的 case 和 fallback；不会因为代码外形相似就机械提取，也不会建议削弱正确性、兼容性、恢复、可观测性或回滚安全的简化。

严重级别具有稳定含义：

- `Blocking：必须修改`：可能破坏 clean checkout、CI、构建、运行时、关键流程或数据完整性。被 tracked 代码引用的未跟踪文件属于 Blocking。
- `Risk：建议修改`：可能造成边界场景故障、竞态、状态不一致、错误处理不足、性能回归或不安全耦合。
- `Improve：可优化`：可选的可维护性、命名、类型表达或文件存放优化。

在 Quick 和 Deep Review 中，`Cannot Verify：无法验证` 是证据状态，不是严重级别；在 Fix Review 中，它是历史问题的回审状态；在 `Design / Simplify` 中，它是当前范围证据不足时的设计判断。不得用它替代 `Blocking`、`Risk` 或 `Improve`。

Fix Review 保留问题的原严重级别，并为每个历史问题分配且只分配一种状态：`Resolved：已解决`、`Partially Resolved：部分解决`、`Unresolved：未解决`、`Cannot Verify：无法验证`。修复引入的新问题单独归入 `New Regression：新增回归`。

修复若改变架构或暴露更广风险，仍应按 Fix Review 的模板和预算完成当前回审，再建议独立执行 Deep Review；不得把两种模式混成一份报告。

### 官方文档与浏览器证据

仓库源码、调用链、锁文件、已安装依赖的源码或类型、配置和项目文档始终是第一证据源。当 Finding 依赖版本敏感的框架或库语义且本地证据不足时，只能通过工具合同允许 Code Review 的渠道查询官方文档。Context7 官方 MCP 工具合同排除了 Code Review，因此审查期间不得直接或间接使用 Context7，包括委派给 subagent、通过代理工具调用，或改写问题以绕过限制。没有允许的官方文档渠道时，将对应外部语义标记为 `Cannot Verify：无法验证`，不作猜测；也不得向外部文档服务发送私有源码、接口数据、内部路径、凭据或用户数据。

Playwright 或等价浏览器工具只提供可选运行时证据，不是 Skill 的硬依赖。仅当问题涉及可观察的浏览器行为且同时满足全部条件时才运行：已有可运行的本地或隔离环境；入口明确；初始状态可控且可重复，或可在每次运行前重建，并且不依赖生产数据或真实账号；预期观察结果明确；无需安装依赖、修改配置或仓库、访问生产环境、使用真实敏感数据，且不会产生破坏性或不可逆副作用。各模式预算如下：

- Quick Review：默认跳过；仅在能够实质消除不确定性时验证最多一条关键路径。
- Deep Review：验证主路径，以及最多一条有证据支持的高风险路径。
- Fix Review：必须复用原问题的环境、初始状态、复现步骤和可观察断言。任一必要条件缺失时使用 `Cannot Verify：无法验证`；不同环境的结果可以单独记录，但不能据此标记 `Resolved：已解决`。仅在有证据支持时额外验证一条直接受影响的回归路径。

在 `浏览器运行证据` 中记录环境与 URL 类型、入口、browser 与 viewport、初始状态及其重建方式、预期结果、操作、观察结果，以及经过掩码的 console/network 摘要。客户端没有浏览器自动化能力或环境不可用时，继续静态审查，并将受影响的运行时结论标记为 `Cannot Verify：无法验证`。浏览器验证通过不能外推为真实 WebView、Native Bridge、真机或生产环境已验证。跨客户端降级规则见[兼容性说明](docs/compatibility.md)。

完整输出示例：

- [Quick Review 中文示例](examples/outputs/quick-review.zh-CN.md)
- [Deep Review 示例](examples/outputs/deep-review.md)
- [Fix Review 中文示例](examples/outputs/fix-review.zh-CN.md)

## 本地验证

验证 Skill 结构：

```bash
python3 /path/to/skill-creator/scripts/quick_validate.py skills/fe-code-review
```

验证器需要安装 `PyYAML` 的 Python 环境。

运行仓库测试：

```bash
pnpm install --frozen-lockfile
pnpm test
```

Vitest 负责验证仓库结构、适配器、引用文件和必需审查契约。AI 审查质量使用[人工评测协议](docs/evaluation.md)验证，不使用确定性单元测试伪造模型质量结论。

## 项目文档

- [更新日志](CHANGELOG.md)
- [兼容性说明](docs/compatibility.md)
- [评测协议](docs/evaluation.md)
- [v0.2.0 评测结果](docs/evaluation-results/v0.2.0.md)
- [v0.1.1 评测结果](docs/evaluation-results/v0.1.1.md)
- [版本与发布规则](docs/versioning.md)
- [路线图](docs/roadmap.md)

## 发布检查

- 执行 `pnpm install --frozen-lockfile` 和 `pnpm test`。
- 执行仓库内验证器与官方 Skill 验证器。
- 对所有声明为运行时已验证的客户端执行直接调用。
- 覆盖 Quick、Deep、Fix Review 验收场景。
- 确认审查保持只读，并区分静态证据与运行时验证。
- 更新 CHANGELOG、兼容性证据和当前版本评测结果。
- 遵循[版本与发布规则](docs/versioning.md)，不得移动已经发布的 tag。

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

当前稳定版本为 `v0.1.0`。需要可复现安装时，应固定 Release tag，不要直接安装 `main`。

```bash
git clone --depth 1 --branch v0.1.0 \
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

| 客户端 | v0.1.0 验证证据 | 状态 |
| --- | --- | --- |
| Codex | Quick 冒烟测试，以及 Quick、Deep、Fix 人工实测 | 运行时已验证 |
| Cursor 3.12.17 | 项目级 Skill 安装与 Quick 冒烟测试 | 运行时已验证 |
| Claude Code 2.1.206 | Skill 结构与适配器验证 | 结构通过，运行时未验证 |

由于当前可用 Claude 账号订阅已到期，Claude Code 运行时明确记录为 `Cannot Verify：无法验证`，不会被描述为运行通过。详细证据和限制见[兼容性说明](docs/compatibility.md)与 [v0.1.0 评测结果](docs/evaluation-results/v0.1.0.md)。

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

| 模式 | 必需输出 |
| --- | --- |
| Quick Review | 总体结论、准确审查范围、按优先级排列的问题、工程质量检查、测试缺口、证据和最终建议 |
| Deep Review | Quick Review 内容，加上变更理解、变更地图、需求缺口、跨模块影响和上线风险 |
| Fix Review | 回审结论、历史问题状态、新增回归、行为差异、剩余测试缺口和关闭建议 |

每份审查报告应提供：

- 提交或下一步建议。Quick Review 使用 `可以提交`、`修改后提交`、`不建议提交`；Deep Review 使用对应的“进入下一步”表述。
- 比较基线和请求范围，包括已修改、已暂存、未暂存、未跟踪文件。
- 按 `Blocking：必须修改`、`Risk：建议修改`、`Improve：可优化` 分类的问题。
- 每个重要问题的文件与行号、触发条件、影响、根因、建议方案和验证方式。
- 独立的设计与简化、命名与可读性、文件存放与模块边界检查。
- 测试缺口、本地证据、实际执行的命令、跳过的验证和仍未验证的运行时路径。
- 与未解决 Blocking 和验证边界一致的最终建议。

严重级别具有稳定含义：

- `Blocking：必须修改`：可能破坏 clean checkout、CI、构建、运行时、关键流程或数据完整性。被 tracked 代码引用的未跟踪文件属于 Blocking。
- `Risk：建议修改`：可能造成边界场景故障、竞态、状态不一致、错误处理不足、性能回归或不安全耦合。
- `Improve：可优化`：可选的可维护性、命名、类型表达或文件存放优化。

Fix Review 保留问题的原严重级别，并为每个历史问题分配且只分配一种状态：`Resolved：已解决`、`Partially Resolved：部分解决`、`Unresolved：未解决`、`Cannot Verify：无法验证`。修复引入的新问题单独归入 `New Regression：新增回归`。

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
- [v0.1.0 评测结果](docs/evaluation-results/v0.1.0.md)
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

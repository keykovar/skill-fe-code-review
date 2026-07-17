# Prompt Examples

## Quick Review

```text
Use fe-code-review, Quick Review the current uncommitted changes.
```

```text
Use fe-code-review to review the staged diff in read-only mode.
```

## Deep Review

```text
Use fe-code-review, Deep Review main...HEAD. Focus on regression risk, test gaps, and release risk.
```

```text
Use fe-code-review to review this feature branch. It touches routing, global store, and WebView bridge.
```

## Fix Review

```text
Use fe-code-review, Fix Review the current changes against the previous review findings. Verify each finding and check for new regressions. Read-only.
```

```text
使用 fe-code-review，Fix Review 当前修改。以上一次 Review 的问题列表为基线，逐项确认是否已解决，并检查修复是否引入新回归。只读，不修改代码。
```

For a new task or conversation, include the previous review report or a readable path to it and identify the fix range.

## Focused Review

```text
Use fe-code-review to check naming, readability, file placement, and module boundaries in the current diff.
```

```text
Use fe-code-review to review this dependency upgrade. Check version-specific behavior and build risk.
```

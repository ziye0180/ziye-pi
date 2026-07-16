---
description: 规范化提交当前变更，含 changelog、commit、tag 和推送
argument-hint: "[instructions]"
---
再次提交当前变更（即使刚刚已经执行过，也必须再次执行一次）。

附加说明：$ARGUMENTS

按顺序执行以下操作：

## 1. Changelog

在提交前，根据变更内容更新相关包的 `## [Unreleased]` 章节：

- packages/ai/CHANGELOG.md
- packages/tui/CHANGELOG.md
- packages/coding-agent/CHANGELOG.md

Changelog 章节（按顺序）：
- `### Breaking Changes` - 需要迁移的 API 变更
- `### Added` - 新增功能
- `### Changed` - 现有功能变更
- `### Fixed` - 问题修复
- `### Removed` - 移除的功能

规则：
- 先读取完整 `[Unreleased]` 章节，再追加到已有子章节；绝不要重复子章节
- 跨包重复规则：`ai`、`agent` 或 `tui` 中影响最终用户的变更应同步到 `coding-agent` changelog
- 跳过：纯 changelog 更新、纯文档变更、生成的模型目录变更

## 2. 暂存

- 仅暂存本次会话中修改的文件
- 显式指定路径：`git add <path1> <path2>`
- 绝不要使用 `git add -A` 或 `git add .`

## 3. 提交

提交信息格式：

```
{feat,fix,docs}[(ai,tui,agent,coding-agent)]: <简短描述>

- <变更点1>
- <变更点2>
```

- 类型：`feat`（新功能）、`fix`（修复）、`docs`（文档）
- 范围：`ai`、`tui`、`agent`、`coding-agent`，可组合（如 `feat(ai,tui): ...`）
- 信息应内容翔实且精炼
- 如果关联 GitHub issue，在提交信息末尾添加 `closes #<编号>` 或 `fixes #<编号>`

## 4. 检查

代码变更（非文档类）提交前运行：

```bash
npm run check
```

修复所有 errors、warnings 和 infos 后再提交。

## 5. Tag（如需要）

如果是发布版本，打 tag：

```bash
git tag -a v<版本号> -m "<版本说明>"
```

## 6. 推送

```bash
git push
git push --tags  # 如有 tag
```

## 约束

- 永远不要暂存不相关的文件
- 永远不要使用 `git add .` 或 `git add -A`
- 不要从非 main 分支推送，除非用户明确说明
- 除非用户明确要求，否则不要创建 PR
- 不要提交 lockfile，除非设置 `PI_ALLOW_LOCKFILE_CHANGE=1`

---
description: 发布前审查 changelog 条目
---
审查自上次发布以来所有 commit 对应的 changelog 条目。

## 流程

1. **找到最新发布的 tag：**
   ```bash
   git tag --sort=-version:refname | head -1
   ```

2. **列出该 tag 之后的所有 commit：**
   ```bash
   git log <tag>..HEAD --oneline
   ```

3. **阅读每个包的 [Unreleased] 段：**
   - packages/ai/CHANGELOG.md
   - packages/tui/CHANGELOG.md
   - packages/coding-agent/CHANGELOG.md

4. **针对每个 commit，检查：**
   - 跳过：changelog 更新、纯文档修改、发布杂务
   - 跳过：生成的模型目录（如 `packages/ai/src/models.generated.ts`），除非伴随非生成源码/文档中的面向用户的改动
   - 确定 commit 影响哪些包（用 `git show <hash> --stat`）
   - 验证受影响包的 changelog 中有对应条目
   - 对于外部贡献（PR），验证格式：`描述 ([#N](url) by [@user](url))`

5. **跨包重复规则：**
   `ai`、`agent` 或 `tui` 中对最终用户有影响的改动，需同步复制到 `coding-agent` 的 changelog，因为 coding-agent 是面向用户的包，依赖这些底层包。

6. **changelog 修复后添加 New Features 段：**
   - 在 `packages/coding-agent/CHANGELOG.md` 的 `## [Unreleased]` 段开头插入 `### New Features`
   - 向用户提案 top 新功能，确认后再写入
   - 尽可能链接到相关文档和段落

7. **报告：**
   - 列出缺少条目的 commit
   - 列出需要跨包复制的条目
   - 直接补上所有缺失条目

## Changelog 格式参考

段落（按顺序）：
- `### Breaking Changes` - 需要迁移的 API 变更
- `### Added` - 新功能
- `### Changed` - 现有功能变更
- `### Fixed` - Bug 修复
- `### Removed` - 移除的功能

署名格式：
- 内部改动：`修复了某某 ([#123](https://github.com/earendil-works/pi-mono/issues/123))`
- 外部贡献：`新增某某功能 ([#456](https://github.com/earendil-works/pi-mono/pull/456) by [@user](https://github.com/user))`

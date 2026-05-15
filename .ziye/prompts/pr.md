---
description: 审查 PR，进行结构化 issue 和代码分析
argument-hint: "<PR-URL>"
---
给定一个或多个 GitHub PR URL：$@

对每个 PR URL，按顺序执行：

1. 分析开始前通过 GitHub CLI 给 PR 打上 `inprogress` 标签。如果打标签失败，明确报告并继续。
2. 完整阅读 PR 页面，包括描述、所有评论、所有 commit 和所有变更文件。
3. 识别 PR 正文、评论、commit 消息或交叉引用中引用的所有关联 issue。完整阅读每个 issue，包括所有评论。
4. 分析 PR diff。从当前 main 分支完整阅读所有相关代码文件（不截断），与 diff 对比。除非文件在 main 上缺失或 diff 上下文不足，不要拉取 PR 文件 blob。包含不在 diff 中但验证行为必需的关联代码路径。
5. 检查相关 `packages/*/CHANGELOG.md` 文件中是否有 changelog 条目。报告是否存在。如果缺失，声明合并前需要 changelog 条目，且用户决定合并时你会补充。遵循 AGENTS.md 中的 changelog 格式规则。验证：
   - 条目使用了正确的段落（`### Breaking Changes`、`### Added`、`### Fixed` 等）
   - 外部贡献包含 PR 链接和作者：`修复了某某 ([#123](https://github.com/earendil-works/pi-mono/pull/123) by [@user](https://github.com/user))`
   - Breaking changes 放在 `### Breaking Changes` 中，而非仅 `### Fixed`
6. 检查 packages/coding-agent/README.md、packages/coding-agent/docs/*.md、packages/coding-agent/examples/**/*.md 是否需要修改。当现有功能变更或新增功能时通常需要。
7. 提供结构化审查，包含以下段落：
   - Good：可靠的选择或改进
   - Bad：具体问题、回归、缺少测试或风险
   - Ugly：隐蔽或高影响的问题
8. 如有不明确之处，补充 Questions or Assumptions。
9. 补充 Change summary 和 Tests。

每个 PR 的输出格式：
PR: <url>
Changelog:
- ...
Good:
- ...
Bad:
- ...
Ugly:
- ...
Questions or Assumptions:
- ...
Change summary:
- ...
Tests:
- ...

如果没发现问题，在 Bad 和 Ugly 下说明"未发现"。

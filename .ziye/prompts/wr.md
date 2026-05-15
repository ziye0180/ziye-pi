---
description: 端到端完成当前任务，含 changelog、commit 和 push
argument-hint: "[指令]"
---
收尾。

附加指令：$ARGUMENTS

先从对话历史确定上下文。

上下文检测规则：
- 如果对话中已提到 GitHub issue 或 PR，沿用该上下文。
- 如果工作源自 `/is` 或 `/pr`，假定 issue 或 PR 上下文已在对话和已完成的分析工作中已知。
- 如果对话历史中没有 GitHub issue 或 PR，按非 GitHub 工作处理。

除非我在本次请求中显式覆盖某项，按顺序执行：

1. 按仓库 changelog 规则，在 `## [Unreleased]` 下添加或更新相关包的 changelog 条目。
2. 如果本次任务关联 GitHub issue 或 PR，且本次会话中尚未发布最终 issue 或 PR 评论，用我的语气起草、预览并发布一条最终评论。
3. 只提交你在本次会话中修改过的文件。
4. 如果本次任务恰好关联一个 GitHub issue，在 commit message 中包含 `closes #<issue>`。如果关联多个 issue，停下来询问使用哪个。如果没有关联任何 issue，commit message 中不要包含 `closes #` 或 `fixes #`。
5. 检查当前 git 分支。如果不是 `main`，停下来询问。除非我明确允许，不要从其他分支推送。
6. 推送当前分支。

约束：
- 绝对禁止暂存无关文件。
- 绝对禁止使用 `git add .` 或 `git add -A`。
- 代码有改动时提交前运行必要检查。
- 除非我明确要求，不要开 PR。
- 如果不是 GitHub issue 或 PR 工作，不要发 GitHub 评论。
- 如果本次会话中已发过最终 issue 或 PR 评论，除非我明确要求，不要重复发。

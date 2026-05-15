---
description: 分析 GitHub issue（bug 或功能请求）
argument-hint: "<issue>"
---
分析 GitHub issue：$ARGUMENTS

对每个 issue：

1. 分析开始前通过 GitHub CLI 给 issue 打上 `inprogress` 标签。如果打标签失败，明确报告并继续。
2. 完整阅读 issue，包括所有评论和关联的 issue/PR。
3. 不要轻信 issue 中已有的分析。独立验证行为，从代码和执行路径推导你自己的分析。

4. **对于 bug**：
   - 忽略 issue 中的根因分析（大概率是错的）
   - 完整阅读所有相关代码文件（不截断）
   - 追踪代码路径，定位真正的根因
   - 提出修复方案

5. **对于功能请求**：
   - 不经验证不要轻信 issue 中的实现方案
   - 完整阅读所有相关代码文件（不截断）
   - 提出最简实现方案
   - 列出受影响的文件和所需改动

除非被明确要求，只分析提案，不实施。

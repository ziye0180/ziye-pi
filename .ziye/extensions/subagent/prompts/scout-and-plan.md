---
description: scout 收集上下文，planner 创建实现计划（不实施）
---
使用 subagent 工具的 chain 参数执行此工作流：

1. 首先，使用 "scout" agent 找到所有与以下相关的代码：$@
2. 然后，使用 "planner" agent 根据前一步的上下文（使用 {previous} 占位符）为 "$@" 创建实现计划

以链式模式执行，通过 {previous} 在步骤间传递输出。不要实施 —— 只返回计划。

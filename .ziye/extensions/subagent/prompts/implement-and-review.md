---
description: worker 实施，reviewer 审查，worker 应用反馈
---
使用 subagent 工具的 chain 参数执行此工作流：

1. 首先，使用 "worker" agent 实施：$@
2. 然后，使用 "reviewer" agent 根据前一步的实施结果进行审查（使用 {previous} 占位符）
3. 最后，使用 "worker" agent 根据审查反馈修改代码（使用 {previous} 占位符）

以链式模式执行，通过 {previous} 在步骤间传递输出。

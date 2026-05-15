# Subagent 示例

将任务委托给具有隔离上下文的专业化子 agent。

## 功能

- **隔离上下文**：每个子 agent 运行在独立的 `pi` 进程中
- **流式输出**：实时看到工具调用和进度
- **并行流式**：所有并行任务同时流式更新
- **Markdown 渲染**：最终输出用正确格式渲染（展开视图）
- **用量追踪**：显示每个 agent 的轮次、token、费用和上下文使用
- **中断支持**：Ctrl+C 传播以终止子 agent 进程

## 目录结构

```
subagent/
├── README.md            # 本文件
├── index.ts             # 扩展入口
├── agents.ts            # Agent 发现逻辑
├── agents/              # 示例 agent 定义
│   ├── scout.md         # 快速侦察，返回压缩上下文
│   ├── planner.md       # 创建实现计划
│   ├── reviewer.md      # 代码审查
│   └── worker.md        # 通用 agent（完整能力）
└── prompts/             # 工作流预设（提示词模板）
    ├── implement.md     # scout → planner → worker
    ├── scout-and-plan.md    # scout → planner（不实施）
    └── implement-and-review.md  # worker → reviewer → worker
```

## 安装

在仓库根目录创建符号链接：

```bash
# 符号链接扩展（必须放在有 index.ts 的子目录下）
mkdir -p ~/.ziye/agent/extensions/subagent
ln -sf "$(pwd)/.ziye/extensions/subagent/index.ts" ~/.ziye/agent/extensions/subagent/index.ts
ln -sf "$(pwd)/.ziye/extensions/subagent/agents.ts" ~/.ziye/agent/extensions/subagent/agents.ts

# 符号链接 agent 定义
mkdir -p ~/.ziye/agent/agents
for f in .ziye/extensions/subagent/agents/*.md; do
  ln -sf "$(pwd)/$f" ~/.ziye/agent/agents/$(basename "$f")
done

# 符号链接工作流 prompts
mkdir -p ~/.ziye/agent/prompts
for f in .ziye/extensions/subagent/prompts/*.md; do
  ln -sf "$(pwd)/$f" ~/.ziye/agent/prompts/$(basename "$f")
done
```

## 安全模型

此工具执行一个独立的 `pi` 子进程，使用委托的系统提示词和工具/模型配置。

**项目级 agent**（`.ziye/agents/*.md`）是仓库控制的提示词，可以指示模型读取文件、运行 bash 命令等。

**默认行为**：仅加载**用户级 agent**（来自 `~/.ziye/agent/agents`）。

要启用项目级 agent，传 `agentScope: "both"`（或 `"project"`）。仅对你信任的仓库这样做。

交互运行时，运行项目级 agent 前会弹确认框。设置 `confirmProjectAgents: false` 禁用。

## 用法

### 单 agent
```
用 scout 找到所有认证相关代码
```

### 并行执行
```
并行运行 2 个 scout：一个找 model，一个找 provider
```

### 链式工作流
```
用 chain：先让 scout 找到 read 工具，再让 planner 提改进建议
```

### 工作流 prompts
```
/implement 给 session store 加 Redis 缓存
/scout-and-plan 重构 auth 以支持 OAuth
/implement-and-review 给 API 端点加输入校验
```

## 工具模式

| 模式 | 参数 | 描述 |
|------|-----------|-------------|
| 单 agent | `{ agent, task }` | 一个 agent，一个任务 |
| 并行 | `{ tasks: [...] }` | 多个 agent 并发运行（最多 8 个，4 个并发） |
| 链式 | `{ chain: [...] }` | 顺序执行，用 `{previous}` 占位符传递上下文 |

## 输出展示

**折叠视图**（默认）：
- 状态图标（✓/✗/⏳）和 agent 名称
- 最近 5-10 项（工具调用和文本）
- 用量统计：`3 turns ↑输入量 ↓输出量 R缓存读 W缓存写 $费用 ctx:上下文token model`

**展开视图**（Ctrl+O）：
- 完整任务文本
- 所有工具调用及格式化参数
- 最终输出渲染为 Markdown
- 每个任务的用量（链式/并行模式）

**并行模式流式**：
- 显示所有任务及实时状态（⏳ 运行中，✓ 完成，✗ 失败）
- 随每个任务进展更新
- 显示 "2/3 完成，1 运行中" 状态

**工具调用格式化**（模拟内置工具）：
- bash：`$ 命令`
- read：`read ~/path:1-10`
- grep：`grep /pattern/ in ~/path`
- 等等

## Agent 定义

Agent 是带 YAML frontmatter 的 markdown 文件：

```markdown
---
name: my-agent
description: 这个 agent 做什么
tools: read, grep, find, ls
model: claude-haiku-4-5
---

这里写 agent 的系统提示词。
```

**位置：**
- `~/.ziye/agent/agents/*.md` - 用户级（始终加载）
- `.ziye/agents/*.md` - 项目级（仅当 `agentScope: "project"` 或 `"both"` 时加载）

项目 agent 与用户 agent 同名时，`agentScope: "both"` 下项目级覆盖用户级。

## 示例 Agent

| Agent | 用途 | 模型 | 工具 |
|-------|---------|-------|-------|
| `scout` | 快速代码库侦察 | Haiku | read, grep, find, ls, bash |
| `planner` | 实现计划 | Sonnet | read, grep, find, ls |
| `reviewer` | 代码审查 | Sonnet | read, grep, find, ls, bash |
| `worker` | 通用 agent | Sonnet | （全部默认工具） |

## 工作流 Prompts

| Prompt | 流程 |
|--------|------|
| `/implement <查询>` | scout → planner → worker |
| `/scout-and-plan <查询>` | scout → planner |
| `/implement-and-review <查询>` | worker → reviewer → worker |

## 错误处理

- **退出码 != 0**：工具返回含 stderr/output 的错误
- **stopReason "error"**：LLM 错误传播并附错误消息
- **stopReason "aborted"**：用户中断（Ctrl+C）杀掉子进程，抛出错误
- **链式模式**：在第一个失败步骤停止，报告哪个步骤失败

## 限制

- 折叠视图中输出截断为最近 10 项（展开查看全部）
- 每次调用时重新发现 agent（允许会话中编辑）
- 并行模式限 8 个任务，4 个并发

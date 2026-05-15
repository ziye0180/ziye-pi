# 开发规则

## 对话风格

- 回复保持简短精炼
- 禁止在 commit、issue、PR 评论或代码中使用 emoji
- 禁止冗余的客套话
- 只用技术性文字，友善但直接（如 "Thanks @user" 而非 "Thanks so much @user!"）

## 代码质量

- 在做出大范围修改之前、在编辑尚未完整检查过的文件之前、在用户要求调查或审查时，先通读完整文件。不要仅靠搜索片段进行大范围改动。
- 除非绝对必要，禁止使用 `any` 类型
- 只有单一调用点的单行辅助函数禁止存在，直接内联
- 查阅 node_modules 中的外部 API 类型定义，不要猜测
- **绝对禁止使用内联 import**——禁止 `await import("./foo.js")`，禁止类型位置的 `import("pkg").Type`，禁止类型的动态 import。始终使用标准顶层 import
- 绝对禁止删除或降级代码来修复因依赖过时导致的类型错误；升级依赖
- 在删除功能或看起来有意的代码之前，始终先询问
- 除非用户明确要求，不要保留向后兼容性
- 绝对禁止硬编码按键检查，如 `matchesKey(keyData, "ctrl+x")`。所有按键绑定必须可配置。在匹配对象中添加默认值（`DEFAULT_EDITOR_KEYBINDINGS` 或 `DEFAULT_APP_KEYBINDINGS`）
- **绝对禁止**直接修改 `packages/ai/src/models.generated.ts`。应更新 `packages/ai/scripts/generate-models.ts`

## 命令

- 代码修改后（非文档修改）：`npm run check`（获取完整输出，不要 tail）。在提交前修复所有 error、warning 和 info
- 注意：`npm run check` 不运行测试
- 绝对禁止运行：`npm run dev`、`npm run build`、`npm test`
- 仅在用户指示时运行特定测试：`npx tsx ../../node_modules/vitest/dist/cli.js --run test/specific.test.ts`
- 从包根目录运行测试，不从仓库根目录
- 如果创建或修改测试文件，必须运行该测试文件并迭代直到通过
- 写测试时，运行它们，识别测试或实现中的问题，迭代直到修复
- 对于 `packages/coding-agent/test/suite/`，使用 `test/suite/harness.ts` 加 faux provider。禁止使用真实 provider API、真实 API key 或付费 token
- 问题相关的回归测试放在 `packages/coding-agent/test/suite/regressions/` 下，命名为 `<issue编号>-<简短描述>.test.ts`
- 绝对禁止在用户未要求的情况下提交

## 贡献门禁

- 新贡献者的新 Issue 由 `.github/workflows/issue-gate.yml` 自动关闭
- 没有 PR 权限的新贡献者 PR 由 `.github/workflows/pr-gate.yml` 自动关闭
- 维护者审批评论由 `.github/workflows/approve-contributor.yml` 处理
- 维护者每日审查自动关闭的 Issue
- 不符合 `CONTRIBUTING.md` 质量标准的 Issue 不会被重新打开，也不回复
- `lgtmi` 批准未来的 Issue
- `lgtm` 批准未来的 Issue 以及提交 PR 的权限

创建 Issue 时：

- 添加 `pkg:*` 标签标明 Issue 涉及哪些包
  - 可用标签：`pkg:agent`、`pkg:ai`、`pkg:coding-agent`、`pkg:tui`、`pkg:web-ui`
- 如果 Issue 跨多个包，添加所有相关标签

发布 Issue/PR 评论时：

- 将完整评论写入临时文件，使用 `gh issue comment --body-file` 或 `gh pr comment --body-file`
- 绝对禁止在 shell 命令中通过 `--body` 直接传多行 markdown
- 发布前预览评论的准确文本
- 除非用户明确要求多条评论，只发一条最终评论
- 如果评论格式有误，立即删除，然后发一条修正后的评论
- 评论保持简洁、技术化、与用户语气一致

通过 commit 关闭 Issue 时：

- 在 commit message 中包含 `fixes #<编号>` 或 `closes #<编号>`
- 这会在 commit 合并时自动关闭 Issue

## PR 工作流

- 分析 PR 时先在本地拉取
- 用户批准后：创建 feature 分支，拉取 PR，rebase 到 main，应用调整，提交，合并到 main，推送，关闭 PR，以用户语气留下评论
- 你自己永远不主动开 PR。我们始终在 feature 分支上工作，直到符合用户的所有要求，然后合并到 main 并推送

## 用 tmux 测试 pi 交互模式

在受控的终端环境中测试 pi 的 TUI：

```bash
# 创建指定尺寸的 tmux 会话
tmux new-session -d -s pi-test -x 80 -y 24

# 从源码启动 pi
tmux send-keys -t pi-test "cd /Users/badlogic/workspaces/pi-mono && ./pi-test.sh" Enter

# 等待启动，然后抓取输出
sleep 3 && tmux capture-pane -t pi-test -p

# 发送输入
tmux send-keys -t pi-test "输入你的 prompt" Enter

# 发送特殊按键
tmux send-keys -t pi-test Escape
tmux send-keys -t pi-test C-o  # ctrl+o

# 清理
tmux kill-session -t pi-test
```

## Changelog

位置：`packages/*/CHANGELOG.md`（每个包有自己的）

### 格式

在 `## [Unreleased]` 下使用以下段落：

- `### Breaking Changes` - 需要迁移的 API 变更
- `### Added` - 新增功能
- `### Changed` - 现有功能变更
- `### Fixed` - Bug 修复
- `### Removed` - 移除的功能

### 规则

- 添加条目前，通读完整的 `[Unreleased]` 段，确认已有哪些子段
- 新增条目始终放在 `## [Unreleased]` 段下
- 追加到已有子段（如 `### Fixed`），不要创建重复的
- 绝对禁止修改已发布版本的段落（如 `## [0.12.2]`）
- 每个版本段一旦发布即不可变

### 署名

- **内部改动（来自 Issue）**：`修复了某某问题 ([#123](https://github.com/earendil-works/pi-mono/issues/123))`
- **外部贡献**：`新增功能 X ([#456](https://github.com/earendil-works/pi-mono/pull/456) by [@username](https://github.com/username))`

## 新增 LLM Provider（packages/ai）

新增 provider 需要修改多个文件：

### 1. 核心类型（`packages/ai/src/types.ts`）

- 在 `Api` 类型联合中添加 API 标识符（如 `"bedrock-converse-stream"`）
- 创建继承 `StreamOptions` 的 options 接口
- 在 `ApiOptionsMap` 中添加映射
- 在 `KnownProvider` 类型联合中添加 provider 名称

### 2. Provider 实现（`packages/ai/src/providers/`）

创建 provider 文件，导出：

- `stream<Provider>()` 函数，返回 `AssistantMessageEventStream`
- `streamSimple<Provider>()` 用于 `SimpleStreamOptions` 映射
- Provider 专用 options 接口
- 消息/工具转换函数
- 响应解析，发出标准化事件（`text`、`tool_call`、`thinking`、`usage`、`stop`）

### 3. Provider 导出和懒注册

- 在 `packages/ai/package.json` 中添加包的子路径导出，指向 `./dist/providers/<provider>.js`
- 在 `packages/ai/src/index.ts` 中为应保持从根入口可用的 provider 选项类型添加 `export type` 重导出
- 在 `packages/ai/src/providers/register-builtins.ts` 中通过懒加载包装器注册 provider，不要静态 import provider 实现模块
- 在 `packages/ai/src/env-api-keys.ts` 中添加凭证检测

### 4. 模型生成（`packages/ai/scripts/generate-models.ts`）

- 添加从 provider 来源抓取/解析模型的逻辑
- 映射到标准化的 `Model` 接口

### 5. 测试（`packages/ai/test/`）

- 始终在 `stream.test.ts` 中至少用一个代表性模型添加 provider，即使它复用了已有 API 实现（如 `openai-completions`）
- 在适用的更广泛 provider 矩阵中添加：`tokens.test.ts`、`abort.test.ts`、`empty.test.ts`、`context-overflow.test.ts`、`unicode-surrogate.test.ts`、`tool-call-without-result.test.ts`、`image-tool-result.test.ts`、`total-tokens.test.ts`、`cross-provider-handoff.test.ts`
- 对于 `cross-provider-handoff.test.ts`，至少添加一对 provider/model。如果 provider 暴露多个模型家族（如 GPT 和 Claude），每个家族至少添加一对
- 对于非标准认证，创建工具函数（如 `bedrock-utils.ts`），包含凭证检测

### 6. Coding Agent（`packages/coding-agent/`）

- `src/core/model-resolver.ts`：在 `defaultModelPerProvider` 中添加默认模型 ID
- `src/core/provider-display-names.ts`：添加 API-key 登录的显示名称，使 `/login` 和相关 UI 能为内置 API-key 认证显示 provider
- `src/cli/args.ts`：添加环境变量文档
- `README.md`：添加 provider 配置说明
- `docs/providers.md`：添加配置说明、环境变量和 `auth.json` key

### 7. 文档

- `packages/ai/README.md`：添加到 provider 表，文档化 options/auth，添加环境变量
- `packages/ai/CHANGELOG.md`：在 `## [Unreleased]` 下添加条目

## 发布

**同步版本号**：所有包始终共享相同版本号。每次发布同时更新所有包。

**版本语义**（无 major 版本）：

- `patch`：Bug 修复和新功能
- `minor`：API 不兼容变更

### 步骤

1. **更新 CHANGELOG**：确保上次发布以来的所有变更已记录在各受影响包的 CHANGELOG.md 的 `[Unreleased]` 段中

2. **运行发布脚本**：
   ```bash
   npm run release:patch    # 修复和新增
   npm run release:minor    # API 不兼容变更
   ```

脚本处理：版本号提升、CHANGELOG 定稿、提交、打标签、发布、添加新的 `[Unreleased]` 段

## **严重警告** 并行 Agent 的 Git 规则 **严重警告**

多个 agent 可能在同一 worktree 中同时处理不同文件。你必须遵守这些规则：

### 提交

- **只提交你在本次会话中修改的文件**
- 当有关联 Issue 或 PR 时，始终在 commit message 中包含 `fixes #<编号>` 或 `closes #<编号>`
- 绝对禁止使用 `git add -A` 或 `git add .`——这会把其他 agent 的修改也扫进来
- 始终使用 `git add <具体文件路径>`，只列出你修改过的文件
- 提交前运行 `git status` 并确认你只暂存了自己的文件
- 记录你在会话期间创建/修改/删除了哪些文件
- 将 `packages/ai/src/models.generated.ts` 随你实际修改的文件一起提交总是可以的

### 禁止的 Git 操作

这些命令可能破坏其他 agent 的工作：

- `git reset --hard`——销毁未提交的更改
- `git checkout .`——销毁未提交的更改
- `git clean -fd`——删除未追踪文件
- `git stash`——暂存所有更改，包括其他 agent 的
- `git add -A` / `git add .`——暂存其他 agent 未提交的工作
- `git commit --no-verify`——绕过必需的检查，绝对不允许

### 安全工作流

```bash
# 1. 先检查状态
git status

# 2. 只 add 你具体的文件
git add packages/ai/src/providers/transform-messages.ts
git add packages/ai/CHANGELOG.md

# 3. 提交
git commit -m "fix(ai): 描述"

# 4. 推送（如需先 pull --rebase，但绝对禁止 reset/checkout）
git pull --rebase && git push
```

### 如果出现 Rebase 冲突

- 只解决你自己的文件中的冲突
- 如果冲突出现在你未修改的文件中，中止并询问用户
- 绝对禁止 force push

### 用户覆盖

如果用户指令与这里的规则冲突，先确认他们是否要覆盖规则。确认后才执行。

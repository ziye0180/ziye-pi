<p align="center">
  <a href="https://pi.dev">
    <img alt="pi logo" src="https://pi.dev/logo-auto.svg" width="128">
  </a>
</p>
<p align="center">
  <a href="https://discord.com/invite/3cU7Bz4UPx"><img alt="Discord" src="https://img.shields.io/badge/discord-community-5865F2?style=flat-square&logo=discord&logoColor=white" /></a>
  <a href="https://www.npmjs.com/package/@earendil-works/pi-coding-agent"><img alt="npm" src="https://img.shields.io/npm/v/@earendil-works/pi-coding-agent?style=flat-square" /></a>
</p>

> 新贡献者提交的 issue 和 PR 默认会被自动关闭。维护者每天会检查被自动关闭的 issue。详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

# Pi Agent Harness

这是 Pi agent harness 项目的主仓库，包含了我们可自扩展的 coding agent。

* **[@earendil-works/pi-coding-agent](packages/coding-agent)**：交互式 coding agent CLI
* **[@earendil-works/pi-agent-core](packages/agent)**：带工具调用和状态管理的 agent 运行时
* **[@earendil-works/pi-ai](packages/ai)**：统一的多 provider LLM API（OpenAI、Anthropic、Google 等）

了解更多关于 Pi 的信息：

* [访问 pi.dev](https://pi.dev)，项目官网，包含演示
* [阅读文档](https://pi.dev/docs/latest)，你也可以直接让 agent 自我解释

## 所有包

| 包 | 描述 |
|---------|-------------|
| **[@earendil-works/pi-ai](packages/ai)** | 统一的多 provider LLM API（OpenAI、Anthropic、Google 等） |
| **[@earendil-works/pi-agent-core](packages/agent)** | 带工具调用和状态管理的 agent 运行时 |
| **[@earendil-works/pi-coding-agent](packages/coding-agent)** | 交互式 coding agent CLI |
| **[@earendil-works/pi-tui](packages/tui)** | 带差异渲染的终端 UI 库 |

Slack/聊天自动化及工作流相关内容，参见 [earendil-works/pi-chat](https://github.com/earendil-works/pi-chat)。

## 权限与容器化

Pi 不内置用于限制文件系统、进程、网络或凭据访问的权限系统。默认情况下，它以启动它的用户和进程的权限运行。

如果你需要更强的隔离边界，请对 Pi 进行容器化或沙箱化。参见 [packages/coding-agent/docs/containerization.md](packages/coding-agent/docs/containerization.md)，其中提供了三种模式：

- **Gondolin 扩展**：将 `pi` 和 provider 认证保留在宿主机上，同时将内置工具和 `!` 命令路由到本地 Linux 微虚拟机中
- **普通 Docker**：将整个 `pi` 进程运行在本地容器中，实现简单隔离
- **OpenShell**：在受策略控制的沙箱中运行整个 `pi` 进程

## 贡献

贡献指南参见 [CONTRIBUTING.md](CONTRIBUTING.md)，项目特定规则（面向人类和 agent）参见 [AGENTS.md](AGENTS.md)。Pi 的长期规划也可在 [RFCs](https://rfc.earendil.com/keyword/pi/) 中查阅。

## 开发

```bash
npm install --ignore-scripts  # 安装所有依赖，不运行生命周期脚本
npm run build        # 构建所有包
npm run check        # Lint、格式化与类型检查
./test.sh            # 运行测试（无 API 密钥时跳过依赖 LLM 的测试）
./pi-test.sh         # 从源码运行 pi（可从任意目录执行）
```

## 供应链加固

我们将 npm 依赖变更视为需审查的代码变更。

- 直接的外部依赖锁定到精确版本。内部 workspace 包保持版本范围
- `.npmrc` 设置 `save-exact=true` 和 `min-release-age=2`，以避免 npm 解析时引入同日发布的依赖
- `package-lock.json` 是依赖的 ground truth。pre-commit 会阻止意外的 lockfile 提交，除非设置 `PI_ALLOW_LOCKFILE_CHANGE=1`
- `npm run check` 验证锁定的直接依赖、原生 TypeScript 导入兼容性以及生成的 coding-agent shrinkwrap
- 发布的 CLI 包包含 `packages/coding-agent/npm-shrinkwrap.json`（由根 lockfile 生成），以便为 npm 用户锁定传递依赖
- 发布冒烟测试使用 `npm run release:local`，在打标签之前于仓库外部构建、打包并创建独立的 npm 和 Bun 安装环境
- 本地发布安装、文档中的 npm 安装以及 `pi update --self` 在支持的情况下均使用 `--ignore-scripts`
- CI 使用 `npm ci --ignore-scripts` 安装，并且有一个定时 GitHub 工作流运行 `npm audit --omit=dev` 和 `npm audit signatures --omit=dev`
- Shrinkwrap 生成对依赖的生命周期脚本有显式的允许列表；新的含生命周期脚本的依赖在被审查之前会导致检查失败

## 分享你的开源 coding agent 会话

如果你在开源工作中使用 Pi 或其他 coding agent，请分享你的会话。

公开的 OSS 会话数据有助于通过真实任务、工具使用、失败和修复来改进 coding agent，而不是依赖玩具基准测试。

完整说明请参见 [这篇 X 帖子](https://x.com/badlogicgames/status/2037811643774652911)。

要发布会话，请使用 [`badlogic/pi-share-hf`](https://github.com/badlogic/pi-share-hf)。阅读其 README.md 了解设置说明。你只需要一个 Hugging Face 账号、Hugging Face CLI 和 `pi-share-hf`。

你也可以观看[这个视频](https://x.com/badlogicgames/status/2041151967695634619)，其中展示了我如何发布自己的 `pi-mono` 会话。

我定期在此发布自己的 `pi-mono` 工作会话：

- [badlogicgames/pi-mono on Hugging Face](https://huggingface.co/datasets/badlogicgames/pi-mono)

## 许可证

MIT

<p align="center">
  <a href="https://pi.dev">pi.dev</a> 域名由以下慷慨捐赠
  <br /><br />
  <a href="https://exe.dev"><img src="packages/coding-agent/docs/images/exy.png" alt="Exy mascot" width="48" /><br />exe.dev</a>
</p>

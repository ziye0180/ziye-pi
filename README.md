<p align="center">
  <a href="https://pi.dev">
    <img alt="pi logo" src="https://pi.dev/logo-auto.svg" width="128">
  </a>
</p>
<p align="center">
  <a href="https://discord.com/invite/3cU7Bz4UPx"><img alt="Discord" src="https://img.shields.io/badge/discord-community-5865F2?style=flat-square&logo=discord&logoColor=white" /></a>
</p>
<p align="center">
  <a href="https://pi.dev">pi.dev</a> 域名由
  <br /><br />
  <a href="https://exe.dev"><img src="packages/coding-agent/docs/images/exy.png" alt="Exy mascot" width="48" /><br />exe.dev</a> 友情捐赠
</p>

> 新贡献者的 Issue 和 PR 默认自动关闭。维护者每日审查自动关闭的 Issue。详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

# Pi Agent Harness 单体仓库

这是 pi agent harness 项目的大本营，包含我们的自扩展编程 agent。

* **[@earendil-works/pi-coding-agent](packages/coding-agent)**：交互式编程 agent CLI
* **[@earendil-works/pi-agent-core](packages/agent)**：Agent 运行时，含工具调用和状态管理
* **[@earendil-works/pi-ai](packages/ai)**：统一多厂商 LLM API（OpenAI、Anthropic、Google 等）

了解更多：

* [访问 pi.dev](https://pi.dev)，项目官网含演示
* [阅读文档](https://pi.dev/docs/latest)，也可以直接让 agent 自己解释

## 分享你的 OSS 编程 agent 会话

如果你用 pi 或其他编程 agent 做开源项目，欢迎分享你的会话。

公开的 OSS 会话数据通过真实任务、工具使用、失败和修复来帮助改进编程 agent，而非靠玩具基准测试。

完整说明见 [X 上的这篇帖子](https://x.com/badlogicgames/status/2037811643774652911)。

发布会话用 [`badlogic/pi-share-hf`](https://github.com/badlogic/pi-share-hf)。读它的 README.md 了解配置步骤。你只需要一个 Hugging Face 账号、Hugging Face CLI 和 `pi-share-hf`。

也可以看[这个视频](https://x.com/badlogicgames/status/2041151967695634619)，里面演示了如何发布 `pi-mono` 会话。

我定期在此发布自己的 `pi-mono` 工作会话：

- [badlogicgames/pi-mono on Hugging Face](https://huggingface.co/datasets/badlogicgames/pi-mono)

## 全部包

| 包 | 描述 |
|---------|-------------|
| **[@earendil-works/pi-ai](packages/ai)** | 统一多厂商 LLM API（OpenAI、Anthropic、Google 等） |
| **[@earendil-works/pi-agent-core](packages/agent)** | Agent 运行时，含工具调用和状态管理 |
| **[@earendil-works/pi-coding-agent](packages/coding-agent)** | 交互式编程 agent CLI |
| **[@earendil-works/pi-tui](packages/tui)** | 终端 UI 库，含差分渲染 |
| **[@earendil-works/pi-web-ui](packages/web-ui)** | AI 聊天界面的 Web 组件 |

Slack/聊天自动化和工作流见 [earendil-works/pi-chat](https://github.com/earendil-works/pi-chat)。

## 贡献

贡献指南见 [CONTRIBUTING.md](CONTRIBUTING.md)，项目规则（面向人类和 agent）见 [AGENTS.md](AGENTS.md)。

## 开发

```bash
npm install          # 安装所有依赖
npm run build        # 构建所有包
npm run check        # Lint、格式化、类型检查
./test.sh            # 运行测试（无 API key 时跳过依赖 LLM 的测试）
./pi-test.sh         # 从源码运行 pi（可在任意目录执行）
```

> **注意：** `npm run check` 需要先执行 `npm run build`。web-ui 包使用 `tsc`，依赖来自其他包的编译产物 `.d.ts` 文件。

## 许可证

MIT

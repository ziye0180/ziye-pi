# pi-cockpit 架构与开发全景

作者: ziye

> update_time: 2026-07-17 15:10 CST
> 本文是 pi-cockpit 的主 SSOT:定位、架构、assistant-ui 集成知识、vendored react-pi 二开差异、pi SDK 集成事实、当前进度与已知限制。能力对接明细见 [capability-map.md](capability-map.md),视觉规范见 [design.md](design.md)。

## 定位

pi coding agent 的本地 WebUI 驾驶舱(替代 TUI),Grok 暗色风格。位于 pi fork 仓库(`ziye0180/ziye-pi`)内 `packages/extensions/pi-cockpit`,自包含 pnpm workspace(pi 主仓库用 npm,互不干扰)。

## 架构

```mermaid
flowchart LR
    W["web 前端"] --> P["vite 代理"]
    P --> B["bridge"]
    B --> R["react-pi node"]
    R --> S["pi SDK"]
    S --> F["会话文件"]
    R -.SSE 事件.-> W
```

| 层 | 技术 | 职责 |
|---|---|---|
| `packages/web` | Vite 8 + React 19 + assistant-ui 0.14.26 + Tailwind 4 | Grok 风格 UI,全部经 primitives 自绘(不用官方成品 Thread) |
| vite 代理 | `/api/pi` → 127.0.0.1:31460 | dev 通道,含 SSE 流式 |
| `packages/bridge` | Hono + @hono/node-server | react-pi wire 契约的 HTTP 实现(端点 SSOT = vendored httpClient.ts 头注释表);进程级 unhandledRejection 边界防第三方扩展炸进程 |
| `packages/react-pi` | **vendored** @assistant-ui/react-pi 0.0.6-ziye.1 | 适配层:浏览器 PiClient(HTTP/SSE)+ node PiClient(in-process SDK)+ ExternalStore runtime |
| pi SDK | @earendil-works/pi-coding-agent 0.80.7 | AgentSession per thread,由 PiThreadSupervisor(globalThis 单例)多路复用 |
| 会话持久层 | `~/.pi/agent/sessions/**.jsonl` | append-only 树;归档标记落盘 `~/.pi/agent/cockpit-archive.json` |

安全纪律:web 与 bridge 只绑 `127.0.0.1`,不暴露局域网;远程访问走 SSH 隧道(`ssh -N -L 5173:localhost:5173 ziye@10.0.0.3`)。

## assistant-ui 集成知识

### 路线选择

官方文档的 `useChatRuntime + AI SDK transport` 是接 Vercel AI SDK 后端的路线;cockpit 走 **ExternalStore 型自定义 runtime**(vendored react-pi 的 `usePiRuntime`),两者互斥。`AssistantModal` 是网页角落聊天挂件,全屏驾驶舱不适用。

### 关键机制(源码级结论)

- **能力开关 = 回调存在性**:ExternalStoreAdapter 提供 `onEdit` 则 edit 能力开,`onReload` 开 reload,`setMessages` 开分支切换——不是配置项,是回调注入。
- **queue adapter 吞掉 onNew**:一旦提供 queue adapter,所有正常发送走 `queue.enqueue → controller.sendMessage`,`onNew` 永不触发。任何"发送前拦截"(如 `!` bash)必须收口在 `controller.sendMessage`。
- **分支模型**:`ExportedMessageRepository.fromBranchableArray({message, parentId}[], {headId})`,同 parentId 的多条消息即 sibling;`switchToBranch` 本地切 + `unstable_onBranchChange({headId})` 通知。
- **TriggerPopover 的 Enter 劫持**:composer 文本以触发字符开头时弹层常开、Enter 永远执行选中项——斜杠命令必须"选中即发送",不能"填入待补参"。
- **编辑流**:`ActionBarPrimitive.Edit` → composer 在 message context 变身 EditComposer → send 时 `AppendMessage{parentId=被编辑消息的父, sourceId=被编辑消息}` 路由到 `onEdit`。

### 踩坑清单(实测版,升级时回归)

| 坑 | 真相 |
|---|---|
| `AttachmentPrimitive.unstable_Thumb` | 只渲染 `.ext` 扩展名徽章;官方文档截图的图片缩略图是组件包自绘的。cockpit 自绘(File→objectURL / content dataURL) |
| `hideWhenSingleBranch` | 0.14.26 连多分支的 picker 也一并藏掉;用 `AuiIf s.message.branchCount > 1` 门控 |
| `ComposerIf` / `MessagePrimitive.If` | 已 deprecated;新写法 `AuiIf condition={(s) => ...}`,编辑态字段是 `s.composer.isEditing`(不是 editing) |
| `Attachments` 的 `components` prop | deprecated,用 children render 函数 |
| `AttachmentPrimitive.Name` | Props 是 `Record<string,never>`,要包 span 才能加样式 |
| `threads().item().rename()` | 同步 void,不能 `.catch`,用 try/catch |
| `ThreadPrimitive.Suggestions` | follow-up 语义,数据来自 runtime `suggestions` 字段(react-pi 其实透传 options.suggestions;cockpit 起手建议现为自渲染变通) |
| `unstable_useSlashCommandAdapter` | 弹层 Action 是 `Unstable_TriggerPopover.Action`(子成员) |
| Unstable_ 前缀 API | 官方声明随时可变;升级 assistant-ui 必须回归 SlashCommands / 输入增强相关文件 |

## vendored react-pi(核心资产)

### 为什么 vendor

三路源码级调研(42 万 token,判定带行号)结论:UI 原语层几乎无缺口、pi SDK 只缺两样(物理删消息、queue 单条操作),**80% 能力缺口集中在 react-pi 适配层**。vendor 进 workspace(`packages/react-pi`,exports 直指 TS 源码,vite/tsx/vitest 三消费方直接吃)后适配层变成自己的代码,自带 vitest 测试套件随包。**与上游断开,升级 assistant-ui 大版本时需人工对照上游 react-pi。**

### 二开差异清单(相对上游 0.0.6)

| 类别 | 内容 |
|---|---|
| 兼容 | 相对导入补 `.js` 后缀(nodenext);globalThis.requestAnimationFrame 显式可选成员探测 |
| 契约扩展(PiClient +8) | `getSessionStats` / `compact` / `exportHtml` / `rewindToUserMessage` / `switchToBranch` / `getCommands` / `executeBash` / snapshot 携带 `branches` |
| runtime | `onEdit` + `onReload`(倒序 user 序号对齐,compaction 安全);`setMessages` + `unstable_onBranchChange`(sibling 占位 `pi-branch:{entryId}`);`!`/`!!` bash 拦截在 `sendMessage`;SSE 改为挂载期常驻(原 run-only,idle 广播会丢);`branches_update` 轻量事件(agent_start 清锚点防漂移,agent_end 重推) |
| supervisor | 归档集落盘;listThreads 按 modified 倒序;compact 失败经 error 事件上屏;共享流 stale closeTimer 泄漏修复 |

### rewind 对齐原理(edit/reload/branch 的地基)

投影消息 id 是 `pi-msg:{index}`,不携带 pi 树 entry id(断链)。对齐通道 = **倒序 user 序号**:投影侧数"倒数第 k 个 user 消息",supervisor 侧在当前分支 entries 里取同序号 entry——compaction 只截断头部,倒序索引天然稳定;对不齐即抛错,绝不静默错跳。

## pi SDK 集成事实(源码级)

- `navigateTree(entryId)`:同文件移 leaf。user 节点 → leaf=其 parent 且原文本进返回值 `editorText`;其他节点 → leaf=该节点。**不发 message 事件**,supervisor 必须手动 emit snapshot。旧分支永远保留(append-only)。
- `fork(entryId)` 是**换新会话文件** + runtime 重建,与树内导航是两回事(cockpit 未接)。
- `prompt(text)` **原生解析斜杠命令**(`_tryExecuteExtensionCommand` + `/skill:` 展开 + prompt 模板),发文本即执行。
- `getCommands` 无 SDK 单方法,由三源组合:`extensionRunner.getRegisteredCommands()` + `promptTemplates` + `resourceLoader.getSkills()`(与 RPC get_commands 同构)。
- `executeBash(command, onChunk?, {excludeFromContext})` 自动把结果记入会话;`!!` = excludeFromContext。
- 带交互 UI 的扩展命令(如 /mcp 的 `ctx.ui.custom()`)cockpit 显式不支持:报错上屏 + 进程边界兜住,不炸 bridge。

## 当前进度

### 里程碑链(全部在 origin/main)

| 里程碑 | 内容 |
|---|---|
| M1 | 对话主链路(流式 + thinking + 工具卡)+ Grok 暗色基线 |
| M2 | 审批面(confirm/select/input/editor)+ review 修复 |
| M3 | assistant-ui 全量可插拔能力:富文本(shiki/mermaid/katex)/ 仪表 / 消息操作+附件 / 会话管理 / 语音 / 斜杠命令 |
| vendor | react-pi 源码收编 0.0.6-ziye.1 |
| 热身批 | session-stats / 原生 HTML 导出 / 手动 compact / 归档持久化 / 导出按钮直出 |
| A1 王牌链 | **编辑重跑 / 重新生成 / 分支切换**(navigateTree 四层贯通)+ SSE 常驻修复 |
| TUI 平权批 | slash 接 pi 三源 / `!` bash / 活跃排序 / 归档可见 + bridge 进程边界 + 锚点漂移修复 |
| 质感批 | 附件真缩略图卡片(对齐官方 guide) |

### 剩余待办(明细与优先级见 capability-map)

- **A 组尾巴**:多工作区切换器(A4)、extension notify toast(A5)、AI 自动标题(A6,pi 是否自动命名待核实)、quote 选中引用(A9)、输入增强 @提及/补全/历史(A10)、suggestions 正规化
- **B 组项目级**:生产化常驻(build + bridge 托管静态页 + launchd)、远程访问(Tailscale/隧道常态化 + auth)、pi fork 上游同步 SOP、web 测试基建
- **明确不做**:朗读+点赞点踩(ziye 砍)、物理删消息(pi append-only)、queue 单条操作(需动 pi 核心)

## 运行方式与已知限制

```bash
# mbp 上双进程(dev)
cd packages/bridge && pnpm dev   # tsx watch, 127.0.0.1:31460
cd packages/web   && pnpm dev    # vite, 127.0.0.1:5173
# 本机访问:ssh -N -L 5173:localhost:5173 ziye@10.0.0.3
```

- **HMR 会使 globalThis 缓存的 SSE 共享流失效**(硬刷新即愈,仅 dev)。
- **模型能力 ≠ 链路问题**:deepseek-v4-flash 不支持视觉输入,图片附件链路已验证完整送达(消息 parts 含 image)。
- mbp 的 hypa 扩展会劫持 LLM 面的 bash 工具(环境问题,`!` 走的原生 executeBash 不受影响)。
- 分支序号恒显示当前为 1/N(占位插入序);切到未回复分支时文本不丢但暂不回填 composer。
- compact 大会话真实压缩路径待首次实际使用验证(业务拒绝路径已验)。

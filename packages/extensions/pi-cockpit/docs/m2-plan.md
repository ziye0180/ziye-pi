# pi-cockpit M2 执行任务包

作者: ziye

> 本文件是给 AI agent 执行的 M2 开发任务包。动手前完整读完,严格按优先级、SSOT、验收和红线执行。

## 0. 你是谁 / 在哪 / 干什么

- 你在开发 **pi-cockpit**:pi coding agent 的本地 WebUI 驾驶舱(替代 TUI,浏览器里管理 pi)。
- 项目位置(绝对路径):`/Users/ziye/project/persona/multi-agents/pi/packages/extensions/pi-cockpit`
- 它嵌在 ziye 的 pi fork 仓库内,作为一个独立 pnpm workspace。
- M1 已交付(commit 4dcb0952):对话主链路 + Grok 暗色皮跑通——发 prompt、流式回复、thinking 折叠块、工具执行卡、readiness 门禁、停止/断线不杀 run,全部实测通过。
- **M2 目标**:把驾驶舱从"能对话"升级到"能管理"——会话列表、模型控制、审批面,并修掉 M1 review 遗留的 6 条 P2。

## 1. 架构速览

```
web(packages/web)  --vite proxy /api/pi-->  bridge(packages/bridge)  --SDK 进程内-->  pi
Vite+React19+assistant-ui                    Hono, 127.0.0.1:31460                    deepseek
usePiRuntime(react-pi)                       react-pi 官方 15 端点 HTTP/SSE 契约
```

- **bridge** `packages/bridge/src/`:`env.ts`(HOST 写死 127.0.0.1)、`pi-client.ts`(createPiNodeClient 单例)、`routes.ts`(15 端点 + SSE)、`index.ts`(Hono 入口)。
- **web** `packages/web/src/`:`PiRuntimeProvider.tsx`(createPiHttpClient + usePiRuntime)、`components/Thread.tsx`(主界面)、`Reasoning.tsx`/`ToolCard.tsx`/`MarkdownText.tsx`、`styles.css`(Grok tokens)。

## 2. 必读 SSOT(动手前读,API 一律以实物为准,不凭记忆编)

| SSOT | 路径 | 用途 |
|---|---|---|
| 视觉 SSOT | `docs/design.md` | 所有 UI 遵守它;新组件先补规格再写代码;偏离先改 design.md |
| M1 合同 | `.colt-workflow/run/feature-dev/milestone.md` | 架构、契约、Non-goal 背景 |
| react-pi 契约 | `node_modules/@assistant-ui/react-pi/` 的 README + `dist`/类型 | usePiRuntime / usePiRuntimeExtras / usePiHostUiRequests / PiClient 15 端点的真实签名 |
| assistant-ui skills | pi 仓库根 `.pi/skills/`(aui-thread-list / aui-runtime / aui-primitives / aui-tools / aui-markdown) | 写 assistant-ui 代码前读对应 skill,API 以 skill 为准 |
| 官方参考实现 | assistant-ui monorepo `examples/with-pi/`(GitHub `assistant-ui/assistant-ui`) | `components/assistant-ui/thread.tsx` 有 ModelSelector / HostUiRequestCard / ThreadList 完整实现,抄映射逻辑 |

**assistant-ui skill 发现**:skills 装在 pi 仓库根 `.pi/skills/`,必须在 **pi 仓库根目录**跑 pi 才能自动发现(或用 `--skill` 显式加载)。开发时建议 cwd = pi 仓库根。

## 3. 环境 / 跑法 / 验证

- 包管理器:**pnpm**(仅在 cockpit 目录内)。装依赖:`cd <cockpit> && pnpm --filter @pi-cockpit/web add <pkg>`。
- 起服务(cockpit 根):`pnpm dev` → bridge 127.0.0.1:31460 + web 127.0.0.1:5173。
- 类型检查:`pnpm typecheck`(两包 tsc --noEmit,必须全绿)。
- 浏览器验证:开 `http://127.0.0.1:5173`,真实操作观察(发消息、切会话、选模型等)。

## 4. M2 任务(按优先级,逐个做完→验证→提交,不要囤积)

### T1 会话列表 + 刷新恢复(最高优先)

- 现状:刷新页面回到新空会话,但旧会话数据都在 bridge(`GET /api/pi/threads` 与 SSE snapshot 可证)。
- 做:用 assistant-ui `ThreadListPrimitive` + `ThreadListItemPrimitive` 渲染会话侧栏;支持切换、新建、恢复;应用启动加载线程列表。react-pi 的 `usePiRuntime` 已内含 `useRemoteThreadListRuntime`,多会话能力是现成的,你主要写 UI。
- 读:`aui-thread-list` skill 全文 + with-pi 的 thread-list 渲染。
- 先改 `docs/design.md`:补会话侧栏的视觉规格(宽度、条目、hover、当前项高亮、折叠),再写代码。
- 验收:发几条消息 → 刷新 → 从侧栏切回原会话看到完整历史;能新建会话;当前会话有高亮。

### T2 模型 / thinking 选择器

- react-pi:`usePiRuntimeExtras().setModel({provider,modelId})` / `.setThinkingLevel(level)`;bridge 已有 `GET /api/pi/models`。
- 模型目录 + 当前选中:参考 with-pi `lib/pi-server.ts` 的 handshake 模式(把 `getAvailableModels()` + 默认选中项喂给选择器);thinking 档位来自每个模型的 `supportsThinking` / `availableThinkingLevels`。
- 读:with-pi thread.tsx 的 `ComposerModelSelector`。
- 先补 design.md 选择器规格(放 composer 内,Grok 风格,克制)。
- 验收:composer 里能选模型和 thinking 档,切换后下一条消息用新配置(观察 pi 行为或 context 变化)。

### T3 host-UI 审批面(human-in-the-loop)

- react-pi:`usePiHostUiRequests()` 已通(M1 实测 hypa 工具会触发 host-ui),缺 UI。
- 做:渲染 confirm / select / input / editor 四类阻塞对话。with-pi 的 `HostUiRequestCard` 有完整实现,`responseForRequest` 辅助函数照抄。
- 先补 design.md 审批卡规格。
- 验收:触发一个需审批的操作(如带 confirm 的工具/命令),UI 弹出可批准/拒绝/填写,pi 收到响应后继续。

### T4 修 6 条 P2(M1 review findings)

1. **bridge `routes.ts` POST /threads** — `c.req.json().catch(()=>({}))` 静默把畸形 JSON 吞成 `{}`;改成 parse 失败返回 400(fail-fast)。
2. **web `Thread.tsx` clearQueue** — 失败只 console.error,缺可见 UI 反馈;接入错误反馈(可复用 LastErrorBanner 或就地提示)。
3. **bridge `routes.ts` SSE handler** — heartbeat/unsubscribe 清理只挂在 `onAbort` 一条路;改成 `try { ...await finished } finally { clearInterval; unsubscribe?.() }` 结构性免疫泄漏。
4. **web `ToolCard.tsx`** — `status.type === "requires-action"` 当前渲染成成功 ✓;给它一个区别于成功的字形(如等待态图标)。
5. **bridge `routes.ts` 边界解析** — `input`/`level`/`response`/setModel body 直通 SDK(隐式 any),唯独 PATCH title 校验;统一策略(要么都在边界解析校验,要么明确信任单一 client 并注释说明)。
6. **web `vite.config.ts`** — proxy 硬编码 31460,而 bridge `env.ts` 允许 `PI_COCKPIT_PORT` 覆盖,双源;让二者读同一 env,或注释声明"改端口需同步"。

### T5 生产单进程模式(可选,时间够再做)

- bridge 托管 web 的 build 产物(`vite build` → bridge 静态服务),一个进程一个端口,免双服务;开发仍用 `pnpm dev` 双服务 + HMR。

## 5. 每个任务的收口纪律(必守)

1. 动手前读对应 SSOT / skill,API 不凭记忆。
2. UI 遵守 `docs/design.md`;新组件**先改 design.md 补规格**再写代码。
3. **fail-fast**:错误冒泡不吞、不静默 fallback;异步 UI 处理 loading / error / empty 三态。
4. **动效**:transition 200-300ms(全局默认缓动已指向 `--ease-cockpit`),禁 linear,禁装饰性色块/高光条。
5. **只绑 127.0.0.1**:bridge 和 vite 都是,别改成 0.0.0.0(安全红线)。
6. 收口三件套:`pnpm typecheck` 全绿 + 浏览器实测(截图/可观察证据) + git 精确提交。
7. **提交纪律(pi 仓库 AGENTS.md)**:`git add <显式路径>`,禁 `git add -A`/`git add .`;禁 `git reset --hard`/`git clean`/`git stash`/force push/`--no-verify`;只提交你本次改的文件;message 用 `feat/fix/docs(scope): ...`。

## 6. 红线(越线立即停,报告 ziye)

- **不改 pi 主体**:`packages/{ai,agent,tui,coding-agent,orchestrator}` 一律不碰;你只动 `packages/extensions/pi-cockpit/`。
- **不碰 pi 仓库根**的 npm / package-lock.json / npm-shrinkwrap.json / scripts(fork 要吃上游更新,动了必冲突)。
- cockpit 内只用 pnpm,绝不引入 npm。
- 破坏性变更、架构级取舍、契约 shape 改动、或任何"我不确定"→ 停下,把风险和选项报告 ziye,不要猜着往下写。
- 需求或验收不清时先对齐,不自行扩大范围。

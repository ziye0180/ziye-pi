# pi-cockpit M3 执行任务包 — assistant-ui 能力全量对接

作者: ziye

> 给 AI agent 执行的 M3 开发任务包。目标:把 assistant-ui 能力盘点中**全部 pluggable(接上就能用)** 的能力对接进 pi-cockpit。动手前完整读完本文件;所有 API 已在实包核实过并标注陷阱,执行时不需要重新调研,但**写码前仍要打开对应 .d.ts 确认签名**。

## 0. 背景与现状

- 项目:`/Users/ziye/project/persona/multi-agents/pi/packages/extensions/pi-cockpit`(pi fork 内,自包含 pnpm workspace;pi 主仓 npm 勿碰)
- M1+M2 已交付:对话主链路(流式/thinking/工具卡)、会话侧栏、模型选择器、host-ui 旁路审批卡、queue 卡、readiness/error 横幅、基础 markdown(remark-gfm)
- 栈:@assistant-ui/react@0.14.26(类型实际来自 @assistant-ui/core@0.2.20)+ @assistant-ui/react-pi@0.0.6 + @assistant-ui/react-markdown@0.14.5 + Vite + React 19 + tailwind v4
- 跑法:cockpit 根 `pnpm dev`(bridge 127.0.0.1:31460 + web 127.0.0.1:5173);typecheck:`pnpm typecheck`

## 1. 必守纪律(同 M2,全文有效)

1. SSOT:UI 遵守 `docs/design.md`,**每个新组件先补 design.md 规格再写码**;API 以实包 `.d.ts` 为准(`packages/web/node_modules/@assistant-ui/{react,react-pi}/`),不凭记忆
2. fail-fast:错误冒泡不吞;异步 UI 三态(loading/error/empty)
3. 动效:200-300ms,全局默认缓动已是 `--ease-cockpit`,禁 linear、禁装饰色块
4. 仅 127.0.0.1;cockpit 内只 pnpm;不碰 pi 主体与仓库根 npm/lockfile
5. 每个 Wave 收口:`pnpm typecheck` 全绿 + 浏览器 127.0.0.1:5173 实测 + git 精确提交(add 显式路径,禁 `git add -A`/force push;`docs/m2-goal.md` 残片不入提交)
6. 不确定/契约变更/破坏性 → 停下报告 ziye

## 2. 实包核实结论:8 个文档陷阱(skill/官方文档说的≠实包,以下为准)

1. `makeAssistantToolUI`/`useAssistantToolUI`/`makeAssistantTool` 全部 @deprecated → 工具专属 UI 直接在现有 `GroupedParts` 回调里**按 `part.toolName` 分发组件**,零新 API
2. Suggestion 状态形状是 `{title,label,prompt}` + `SuggestionPrimitive.Trigger`(**不是** 文档写的 `text/onClick`)
3. `AuiIf` 只有 `condition={(s)=>boolean}` 选择器形态(对象 prop 形态不存在)
4. capabilities **不能手动覆盖**(不存在 `capabilities:` 选项;唯一手动开关 `unstable_capabilities.copy`),能力只由传回调点亮
5. `message.edit()` 不存在;编辑走 `message.composer()`(但 M3 不做编辑,见排除清单)
6. 事件系统 9 个事件 7 个 @deprecated → 状态观察一律用 `useAuiState`
7. `createDirectiveText` 不存在;`@assistant-ui/react-lexical` 未安装(斜杠命令用纯文本路线,不装 lexical)
8. 语音输入类名是 `DictationAdapter`/`WebSpeechDictationAdapter`(不存在 SpeechRecognitionAdapter)

## 3. react-pi 关键边界(决定做法)

- `usePiHostUiRequests()` **只含 free-standing 请求**;单工具执行时的 confirm/select/input/editor 走 **`part.approval` / `part.interrupt`** 字段(工具卡上渲染)——两通道天然不重复,不会双渲染
- adapters 直通口:`usePiRuntime({adapters:{attachments,speech,dictation,feedback}})` 原样透传,传了即点亮对应 capability
- 附件仅 **image** 透传给 pi(`PiInputAttachment`=image);file part 会被 `buildPiSendInput` 静默丢弃;文本文件可用 `SimpleTextAttachmentAdapter`(内容并入 text)
- 每条 assistant 消息 `metadata.custom.pi` 自带 `{provider,model,usage(含 cost),stopReason}`
- 投影产 DataMessagePart:`pi-bash-execution` / `pi-compaction-summary` / `pi-branch-summary` 等,当前 GroupedParts default 返回 null 全部隐身
- react-pi 投影不写 timing → 工具耗时前端自记(status 翻转时刻 useRef)

## 4. 任务清单(按 Wave 顺序执行,每 Wave 一次提交)

### W1 修洞:工具关联审批/中断进工具卡(最高优先,修真实阻塞)

- ToolCard 检测 `part.approval && approval.approved === undefined` → 渲染批准/拒绝按钮,调 `part.respondToApproval`(props 上有);检测 `part.interrupt`(`{type:'human',payload}`)→ 按请求 kind 渲染 select 选项/input/editor,调 `part.resume(payload)`(PiInterruptAnswer:string 或 `{value,dismissed}`)
- 先补 design.md:工具卡内审批区规格(与旁路审批卡同语言,嵌在卡内底部)
- 验收:单工具触发 confirm 时工具卡内出现按钮可批准/拒绝,run 继续;`requires-action` ◌ 状态与按钮同现

### W2 渲染三连+(coding agent 的脸面)

1. **memoized components**:`unstable_memoizeMarkdownComponents` 包一套默认元素表传给 `MarkdownTextPrimitive components`(治流式全树重渲染)
2. **代码高亮**:装 `react-shiki`,写 wrapper 注册 `components.SyntaxHighlighter`(`SyntaxHighlighterProps{language,code}`);暗色主题配 cockpit tokens;流式用其 delay 节流
3. **CodeHeader**:注册 `components.CodeHeader`(`{language,code}`)→ 语言 pill + 复制按钮
4. **Mermaid**:装 `mermaid`,`componentsByLanguage={{mermaid:{SyntaxHighlighter:MermaidDiagram}}}`;**流式 gate**:用 `useAuiState` 检测该 code fence 之后已出现闭合 ``` 才 `mermaid.render`,否则显示"图生成中"占位;渲染失败显示错误+原文(fail-fast 不白屏)
5. **defer**:`MarkdownTextPrimitive` 加 `defer` prop(低优先级解析)
6. **LaTeX**:装 `remark-math rehype-katex katex`,插件链 + katex CSS + 内置 `normalizeMathDelimiters` preprocess
- design.md 先补:代码块(header/高亮配色)、mermaid 图容器、公式的规格
- 验收:让 pi 输出一段含代码块+mermaid+公式的回复,浏览器截图三者渲染正确;长回复流式不卡

### W3 仪表盘(全是 extras/metadata 白送数据)

1. **context 用量条**:`usePiRuntimeExtras().contextUsage{tokens,contextWindow,percent}` → composer 区小型环/条,>80% 变警示色(--danger 仅错误,警示用 --text-2 加粗或描边,遵守禁装饰铁律)
2. **compaction/retry 横幅**:`extras.compaction{active,reason}` / `extras.retry{active,attempt}` → 进行中显示"正在压缩上下文…/自动重试 #N"
3. **每 turn 成本**:assistant 消息 footer 渲染 `metadata.custom.pi.usage`(tokens+cost,13px --text-3,hover 展开明细)
4. **pi 特殊消息卡**:GroupedParts 加 data part 分支,按 `name` 分发:`pi-bash-execution`(用户 ! 命令,终端样式)、`pi-compaction-summary`(压缩发生说明卡)、`pi-branch-summary`;未知 name 渲染成通用折叠卡(不再隐身)
5. **工具耗时**:ToolCard 前端自记 running 开始时刻,完成后显示"N.Ns";可选 `unstable_useMessageStallDetection` 做"仍在工作"指示
- 验收:发长任务观察 context 条变化;消息 footer 有成本;`!ls` 类消息可见

### W4 消息操作 + 附件

1. **ActionBar**:assistant 消息 hover 浮现(`ActionBarPrimitive.Root hideWhenRunning autohide="not-last"`)→ `.Copy`(data-copied 态)+ `.ExportMarkdown`;低频动作收 `ActionBarMorePrimitive` 溢出菜单
2. **选中引用**:`SelectionToolbarPrimitive.Root/.Quote` + `ComposerPrimitive.Quote/.QuoteText/.QuoteDismiss`;**先写探针验证** quote 内容能透传进 pi 消息(react-pi appendMessageParts 路径),透传不了则降级为"引用文本插入 composer 文本"并注释说明
3. **图片附件**:`usePiRuntime({adapters:{attachments:new CompositeAttachmentAdapter([new SimpleImageAttachmentAdapter(), new SimpleTextAttachmentAdapter()])}})`;composer 加 `.AddAttachment/.Attachments/.AttachmentDropzone` + `AttachmentPrimitive` 附件卡;消息侧 `MessagePrimitive.Attachments` 回显;粘贴截图直接进附件
- 验收:复制/导出可用;贴一张截图问 pi"图里是什么"得到回答(deepseek 若不支持视觉,验收改为附件出现在消息里且 pi 收到 image content 不报错,如实记录)

### W5 会话管理 + Composer 增强

1. **重命名**:侧栏条目双击或菜单 → 行内输入,`ThreadListItemPrimitive` 触发 rename(链路已通;pi 无自动标题,generateTitle 是 no-op,别做假功能)
2. **归档**:条目 `.Archive` 按钮 + 侧栏底部"已归档"折叠区(`ThreadListPrimitive.Items archived` + `.Unarchive`);注意归档态是 bridge 进程内存,重启丢——UI 上不用提示,known limitation 记注释
3. **URL 同步**:`usePiRuntime({initialThreadId, onThreadIdChange})` ↔ `history.pushState`/`popstate`,刷新/直链回到同一会话
4. **空态建议**:`usePiRuntime({suggestions:[{title,label,prompt}...]})` + 空态 `ThreadPrimitive.Suggestions` + `SuggestionPrimitive.Trigger send`;放 3-4 个驾驶舱常用 prompt
5. **斜杠命令(本地命令面)**:`ComposerPrimitive.Unstable_TriggerPopoverRoot` + `unstable_useSlashCommandAdapter`;**pi 无 slash 执行 API,命令全部映射驾驶舱本地动作**:`/new`(新会话)`/model`(开模型选择器)`/clear-queue`(清队列)`/export`(导出会话 `aui.thread().export()` 下载 JSON);Unstable_ API 锁版本可接受,注释标注漂移风险
6. **TTS + 听写**:adapters 加 `speech: new WebSpeechSynthesisAdapter()` + `dictation: new WebSpeechDictationAdapter()`;ActionBar 加 `.Speak/.StopSpeaking`,composer 加 `.Dictate/.StopDictation` + 转写展示
7. **点赞点踩**:adapters 加 feedback:`submit({message,type})` POST 到 bridge 新端点 `POST /api/cockpit/feedback`(**注意:自定义端点挂 `/api/cockpit/*` 命名空间,严禁污染 `/api/pi` 的 react-pi 15 端点契约**),bridge 落 `feedback.jsonl` 到项目 `.data/` 目录(gitignore);ActionBar 加两按钮
- 验收:逐条浏览器实测;斜杠命令弹层可键盘导航

## 5. 明确排除(结构性卡死,不做,别画死 UI)

| 排除项 | 卡点 |
|---|---|
| 消息编辑/重新生成/分支切换 | PiClient 契约无 fork/rewind/navigate;react-pi 未接 onEdit/onReload/setMessages |
| 队列单条删除/提升 | pi 上游只有整队 clear(react-pi 源码 no-op 注释) |
| 手动 /compact 按钮 | PiClient 契约无 compact 方法 |
| 前端工具执行/addResult | pi 工具全在后端,架构不搭 |
| MCP apps host / assistant-stream / AI-SDK 续流 / AssistantModal / 实时语音 | 不适用 cockpit 架构 |

## 6. 新依赖清单(全部装 packages/web,pnpm)

`react-shiki`、`mermaid`、`remark-math`、`rehype-katex`、`katex`。装前 `npm view <pkg> version` 确认存在,lockfile 锁定。除此之外**不引入任何其他新依赖**(尤其别装 @assistant-ui/react-lexical、streamdown、assistant-stream)。

## 7. 交付要求

- 每 Wave 独立 commit(`feat(cockpit): ...` 或 `fix(cockpit): ...`,遵守 pi 仓库 AGENTS.md 提交铁律),全部 push origin main
- 全部完成后:跑一轮完整回归(发含代码/mermaid/公式的消息 + 触发工具 + 切会话 + 刷新恢复 + 附件),浏览器截图留证
- 收口报告:每 Wave 的验收证据 + 未尽事项(如 quote 透传探针结果、deepseek 视觉支持情况)如实列出

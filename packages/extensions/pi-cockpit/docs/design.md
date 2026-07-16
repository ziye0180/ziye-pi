# pi-cockpit 设计 SSOT — Grok 暗色基线

作者: ziye

> update_time: 2026-07-16 16:05 CST
> 状态: v1 基线(依 ziye "Grok 风格 1:1" 指令起草,以 grok.com 深色界面为基准;待 M1 截图验收后逐轮修订,本文件是唯一视觉事实源)

## 设计原则

1. Grok 式极简:近黑底、高对比文本、无彩色装饰;界面元素只有"文本、边框、极浅面";克制到近乎无形。
2. 禁装饰色块/heat bar/高光条等纯视觉冗余(ziye 铁律);区分靠排版、间距和字重。
3. 深色单主题(M1 只做 dark,不做 light)。

## Design Tokens

| Token | 值 | 用途 |
|---|---|---|
| --bg | #0b0b0d | 页面背景(近黑) |
| --surface | #17171a | 输入框/卡片面 |
| --surface-2 | #1f1f23 | hover 面/用户气泡 |
| --border | #26262b | 1px 细边框 |
| --border-strong | #3a3a41 | focus 边框 |
| --text | #ececf1 | 主文本 |
| --text-2 | #9a9aa3 | 次级文本(thinking/占位/工具名) |
| --text-3 | #6b6b74 | 弱文本(时间戳/计数) |
| --accent | #ffffff | 主按钮底(白底黑字,Grok 式) |
| --accent-fg | #0b0b0d | 主按钮文字 |
| --danger | #ef4444 | 错误文本/边框(仅错误态) |
| --radius-composer | 24px | 输入框胶囊 |
| --radius-card | 16px | 卡片(工具卡/queue 卡) |
| --radius-bubble | 18px | 用户消息气泡 |

## 布局

- 双区:左会话侧栏(固定 260px)+ 右对话主区(M2 起)
- 主区内单列居中窄栏:max-width 44rem,左右 padding 16px
- Composer 底部 sticky,与内容间自然留白
- 空态(Welcome):垂直居中问候语,大字号(24px semibold)+ 次级副语

## 会话侧栏(M2)

- 宽 260px,--bg 底,右侧 1px --border 分隔(主区内容浮在其上,层次靠边框不靠色差)
- 顶部"新建对话"按钮:全宽,--surface 底 + 1px --border,radius 12px,左侧 + 号,hover --surface-2
- 列表:会话条目纵向排列可滚动;每条 radius 10px、px3 py2、标题单行截断 14px
- 当前会话:--surface-2 底 + --text 文本(高亮);非当前 hover 态 --surface + --text-2 文本
- 删除按钮:条目右侧,默认隐藏(opacity 0),条目 hover 时浮现;--text-3,hover --danger
- 标题 fallback:pi 会话无 title 时显示"未命名对话"
- 空列表:仅保留新建按钮
- 折叠/窄屏响应式留到 M3;M2 先做桌面固定侧栏

## 排版

- 字体:system-ui 栈(-apple-system, "SF Pro", Inter, sans-serif);代码 ui-monospace ("SF Mono", Menlo)
- 正文 15px/1.7;用户气泡同级;thinking 与工具卡 13px
- markdown:标题降两级视觉(h1→18px semibold);代码块 --surface 底 + 1px --border,13px

## 组件规格

| 组件 | 规格 |
|---|---|
| Composer | 胶囊容器:--surface 底、1px --border、radius 24px、内 padding 10px;focus 时边框 --border-strong + ring 白 8%;placeholder --text-2 |
| Send 按钮 | 32px 圆形,白底黑箭头(↑);disabled 时 --surface-2 底 --text-3 箭头 |
| Stop 按钮 | 同尺寸,白底黑方块(■);仅运行中且输入空时替换 Send |
| 用户消息 | 右对齐气泡:--surface-2 底,radius 18px,px16 py10,最大宽 85% |
| 助手消息 | 无气泡,直接排版在背景上(Grok 式),左对齐全宽 |
| thinking 块 | 折叠行:--text-2 13px,"Thinking" + chevron;运行中自动展开,完成后自动收起;内容左侧 2px --border 竖线缩进 |
| 工具卡 | --surface 底 1px --border radius 16px;首行:工具名(等宽 13px --text)+ 状态点(运行=脉冲 --text-2,成功=静默,失败=--danger);args/result 折叠,等宽 12px 预格式 |
| 运行 indicator | 单个 ● 脉冲,--text-2 |
| 错误 | --danger 文本 + 1px --danger/40% 边框卡,13px |
| readiness 横幅 | composer 上方:--surface 底细卡,--text-2 文本,含 message 原文 |
| queue 卡 | composer 上沿连体卡(--surface-2/50%),条目 13px,steer 条目带细边框 pill 标记 |

## 模型选择器(M2)

- 位置:composer 底部左侧,小号 ghost 按钮(与右侧发送键同一行,justify-between)
- 按钮显示:当前模型短名 + thinking 档,如 `deepseek-v4-pro · high`,13px --text-2,hover --text
- 点击向上弹出面板:--surface 底、1px --border、radius 12px、轻阴影;宽约 240px,底部对齐按钮
- 模型区:条目纵向,当前项左侧 √(--text)其余留白,hover --surface-2,13px
- thinking 区:面板下部,仅当前模型 supportsThinking 时显示;档位来自该模型 availableThinkingLevels;横向 pill,当前档 --surface-2 底 + --text,其余 --text-3
- 运行中(status==="running")禁止切换:按钮与条目 disabled,--text-3
- 点击面板外或选中后关闭

## 动效(P012 铁律)

- 全部 transition:200-300ms cubic-bezier(0.22, 1, 0.36, 1);禁 linear;禁裸条件渲染闪切
- 消息入场:fade-in + 4px 上移,150-200ms
- 折叠展开(thinking/工具卡):高度+透明度过渡 250ms
- indicator 脉冲:1.2s ease-in-out 循环(唯一允许的循环动画)

## 可访问性

- 文本对比:--text/--bg ≈ 15:1,--text-2/--bg ≈ 7:1,达标
- 所有 icon 按钮带 aria-label;composer 键盘可达(Enter 发送,Shift+Enter 换行)

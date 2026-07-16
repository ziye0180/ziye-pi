# pi-cockpit M2 任务书(goal 合同)

作者: ziye

> update_time: 2026-07-16 18:20 CST
> 本文档是 M2 的唯一任务合同。执行 agent 必须先完整读取本文档与「必读事实源」,再按「任务清单」优先级顺序逐项实现;每项完成即跑该项验收,全部完成后按「交付要求」收口。

## 1. 项目速览

pi-cockpit 是 pi coding agent 的本地 WebUI 驾驶舱(替代 TUI),位于 pi fork 仓库内 `packages/extensions/pi-cockpit`,自包含 pnpm workspace(pi 主仓库用 npm,互不干扰,禁止改动 pi 主仓库的包
/**
 * Plan Mode 扩展
 *
 * 只读探索模式，安全分析代码。
 * 启用后仅能使用只读工具。
 *
 * 功能：
 * - /plan 命令或 Ctrl+Alt+P 切换
 * - Bash 限制为白名单内的只读命令
 * - 从 "Plan:" 段落中提取编号计划步骤
 * - [DONE:n] 标记完成步骤
 * - 执行过程中显示进度追踪小部件
 */

import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { AssistantMessage, TextContent } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Key } from "@earendil-works/pi-tui";
import { extractTodoItems, isSafeCommand, markCompletedSteps, type TodoItem } from "./utils.js";

// 工具列表
const PLAN_MODE_TOOLS = ["read", "bash", "grep", "find", "ls", "questionnaire"];
const NORMAL_MODE_TOOLS = ["read", "bash", "edit", "write"];

// assistant 消息类型守卫
function isAssistantMessage(m: AgentMessage): m is AssistantMessage {
	return m.role === "assistant" && Array.isArray(m.content);
}

// 从 assistant 消息中提取文本内容
function getTextContent(message: AssistantMessage): string {
	return message.content
		.filter((block): block is TextContent => block.type === "text")
		.map((block) => block.text)
		.join("\n");
}

export default function planModeExtension(pi: ExtensionAPI): void {
	let planModeEnabled = false;
	let executionMode = false;
	let todoItems: TodoItem[] = [];

	pi.registerFlag("plan", {
		description: "以 plan mode 启动（只读探索）",
		type: "boolean",
		default: false,
	});

	function updateStatus(ctx: ExtensionContext): void {
		// 底部栏状态
		if (executionMode && todoItems.length > 0) {
			const completed = todoItems.filter((t) => t.completed).length;
			ctx.ui.setStatus("plan-mode", ctx.ui.theme.fg("accent", `📋 ${completed}/${todoItems.length}`));
		} else if (planModeEnabled) {
			ctx.ui.setStatus("plan-mode", ctx.ui.theme.fg("warning", "⏸ plan"));
		} else {
			ctx.ui.setStatus("plan-mode", undefined);
		}

		// Todo 列表小部件
		if (executionMode && todoItems.length > 0) {
			const lines = todoItems.map((item) => {
				if (item.completed) {
					return (
						ctx.ui.theme.fg("success", "☑ ") + ctx.ui.theme.fg("muted", ctx.ui.theme.strikethrough(item.text))
					);
				}
				return `${ctx.ui.theme.fg("muted", "☐ ")}${item.text}`;
			});
			ctx.ui.setWidget("plan-todos", lines);
		} else {
			ctx.ui.setWidget("plan-todos", undefined);
		}
	}

	function togglePlanMode(ctx: ExtensionContext): void {
		planModeEnabled = !planModeEnabled;
		executionMode = false;
		todoItems = [];

		if (planModeEnabled) {
			pi.setActiveTools(PLAN_MODE_TOOLS);
			ctx.ui.notify(`Plan mode 已启用。工具：${PLAN_MODE_TOOLS.join(", ")}`);
		} else {
			pi.setActiveTools(NORMAL_MODE_TOOLS);
			ctx.ui.notify("Plan mode 已关闭。完整权限已恢复。");
		}
		updateStatus(ctx);
	}

	function persistState(): void {
		pi.appendEntry("plan-mode", {
			enabled: planModeEnabled,
			todos: todoItems,
			executing: executionMode,
		});
	}

	pi.registerCommand("plan", {
		description: "切换 plan mode（只读探索）",
		handler: async (_args, ctx) => togglePlanMode(ctx),
	});

	pi.registerCommand("todos", {
		description: "显示当前 plan 待办列表",
		handler: async (_args, ctx) => {
			if (todoItems.length === 0) {
				ctx.ui.notify("暂无待办。请先用 /plan 创建计划", "info");
				return;
			}
			const list = todoItems.map((item, i) => `${i + 1}. ${item.completed ? "✓" : "○"} ${item.text}`).join("\n");
			ctx.ui.notify(`Plan 进度：\n${list}`, "info");
		},
	});

	pi.registerShortcut(Key.ctrlAlt("p"), {
		description: "切换 plan mode",
		handler: async (ctx) => togglePlanMode(ctx),
	});

	// Plan mode 下拦截破坏性 bash 命令
	pi.on("tool_call", async (event) => {
		if (!planModeEnabled || event.toolName !== "bash") return;

		const command = event.input.command as string;
		if (!isSafeCommand(command)) {
			return {
				block: true,
				reason: `Plan mode：命令被拦截（不在白名单内）。请用 /plan 先关闭 plan mode。\n命令：${command}`,
			};
		}
	});

	// 非 plan mode 时过滤掉过期的 plan mode 上下文
	pi.on("context", async (event) => {
		if (planModeEnabled) return;

		return {
			messages: event.messages.filter((m) => {
				const msg = m as AgentMessage & { customType?: string };
				if (msg.customType === "plan-mode-context") return false;
				if (msg.role !== "user") return true;

				const content = msg.content;
				if (typeof content === "string") {
					return !content.includes("[PLAN MODE ACTIVE]");
				}
				if (Array.isArray(content)) {
					return !content.some(
						(c) => c.type === "text" && (c as TextContent).text?.includes("[PLAN MODE ACTIVE]"),
					);
				}
				return true;
			}),
		};
	});

	// Agent 开始前注入 plan/execution 上下文
	pi.on("before_agent_start", async () => {
		if (planModeEnabled) {
			return {
				message: {
					customType: "plan-mode-context",
					content: `[PLAN MODE 激活中]
你当前处于 plan mode —— 只读探索模式，仅用于安全分析代码。

限制：
- 你只能使用：read、bash、grep、find、ls、questionnaire
- 你无法使用：edit、write（文件修改已禁用）
- Bash 仅限于白名单内的只读命令

使用 questionnaire 工具提出澄清性问题。
通过 bash 使用 brave-search 技能进行网络搜索。

在 "Plan:" 标题下创建详细的编号计划：

Plan:
1. 第一步描述
2. 第二步描述
...

不要尝试做任何修改 —— 只描述你打算怎么做。`,
					display: false,
				},
			};
		}

		if (executionMode && todoItems.length > 0) {
			const remaining = todoItems.filter((t) => !t.completed);
			const todoList = remaining.map((t) => `${t.step}. ${t.text}`).join("\n");
			return {
				message: {
					customType: "plan-execution-context",
					content: `[执行计划中 - 完整工具权限已启用]

剩余步骤：
${todoList}

按顺序执行每个步骤。
完成一步后，在回复中包含 [DONE:n] 标签。`,
					display: false,
				},
			};
		}
	});

	// 每轮结束后追踪进度
	pi.on("turn_end", async (event, ctx) => {
		if (!executionMode || todoItems.length === 0) return;
		if (!isAssistantMessage(event.message)) return;

		const text = getTextContent(event.message);
		if (markCompletedSteps(text, todoItems) > 0) {
			updateStatus(ctx);
		}
		persistState();
	});

	// 处理 plan 完成和 plan mode UI
	pi.on("agent_end", async (event, ctx) => {
		// 检查执行是否完成
		if (executionMode && todoItems.length > 0) {
			if (todoItems.every((t) => t.completed)) {
				const completedList = todoItems.map((t) => `~~${t.text}~~`).join("\n");
				pi.sendMessage(
					{ customType: "plan-complete", content: `**Plan 完成！** ✓\n\n${completedList}`, display: true },
					{ triggerTurn: false },
				);
				executionMode = false;
				todoItems = [];
				pi.setActiveTools(NORMAL_MODE_TOOLS);
				updateStatus(ctx);
				persistState(); // 保存清空后的状态，防止恢复时还原旧的执行模式
			}
			return;
		}

		if (!planModeEnabled || !ctx.hasUI) return;

		// 从最后一条 assistant 消息中提取待办项
		const lastAssistant = [...event.messages].reverse().find(isAssistantMessage);
		if (lastAssistant) {
			const extracted = extractTodoItems(getTextContent(lastAssistant));
			if (extracted.length > 0) {
				todoItems = extracted;
			}
		}

		// 显示 plan 步骤并提示下一步操作
		if (todoItems.length > 0) {
			const todoListText = todoItems.map((t, i) => `${i + 1}. ☐ ${t.text}`).join("\n");
			pi.sendMessage(
				{
					customType: "plan-todo-list",
					content: `**Plan 步骤（${todoItems.length}）：**\n\n${todoListText}`,
					display: true,
				},
				{ triggerTurn: false },
			);
		}

		const choice = await ctx.ui.select("Plan mode - 下一步？", [
			todoItems.length > 0 ? "执行计划（追踪进度）" : "执行计划",
			"保留 plan mode",
			"完善计划",
		]);

		if (choice?.startsWith("执行")) {
			planModeEnabled = false;
			executionMode = todoItems.length > 0;
			pi.setActiveTools(NORMAL_MODE_TOOLS);
			updateStatus(ctx);

			const execMessage =
				todoItems.length > 0
					? `执行计划。从第一步开始：${todoItems[0].text}`
					: "执行你刚刚创建的计划。";
			pi.sendMessage(
				{ customType: "plan-mode-execute", content: execMessage, display: true },
				{ triggerTurn: true },
			);
		} else if (choice === "完善计划") {
			const refinement = await ctx.ui.editor("完善计划：", "");
			if (refinement?.trim()) {
				pi.sendUserMessage(refinement.trim());
			}
		}
	});

	// Session 启动/恢复时还原状态
	pi.on("session_start", async (_event, ctx) => {
		if (pi.getFlag("plan") === true) {
			planModeEnabled = true;
		}

		const entries = ctx.sessionManager.getEntries();

		// 还原持久化的状态
		const planModeEntry = entries
			.filter((e: { type: string; customType?: string }) => e.type === "custom" && e.customType === "plan-mode")
			.pop() as { data?: { enabled: boolean; todos?: TodoItem[]; executing?: boolean } } | undefined;

		if (planModeEntry?.data) {
			planModeEnabled = planModeEntry.data.enabled ?? planModeEnabled;
			todoItems = planModeEntry.data.todos ?? todoItems;
			executionMode = planModeEntry.data.executing ?? executionMode;
		}

		// 恢复时：重新扫描消息重建完成状态
		// 仅扫描最后一次 "plan-mode-execute" 之后的消息，避免误识别之前 plan 的 [DONE:n]
		const isResume = planModeEntry !== undefined;
		if (isResume && executionMode && todoItems.length > 0) {
			// 找到最后一次 plan-mode-execute 条目的索引（标记当前执行开始的位置）
			let executeIndex = -1;
			for (let i = entries.length - 1; i >= 0; i--) {
				const entry = entries[i] as { type: string; customType?: string };
				if (entry.customType === "plan-mode-execute") {
					executeIndex = i;
					break;
				}
			}

			// 只扫描执行标记之后的消息
			const messages: AssistantMessage[] = [];
			for (let i = executeIndex + 1; i < entries.length; i++) {
				const entry = entries[i];
				if (entry.type === "message" && "message" in entry && isAssistantMessage(entry.message as AgentMessage)) {
					messages.push(entry.message as AssistantMessage);
				}
			}
			const allText = messages.map(getTextContent).join("\n");
			markCompletedSteps(allText, todoItems);
		}

		if (planModeEnabled) {
			pi.setActiveTools(PLAN_MODE_TOOLS);
		}
		updateStatus(ctx);
	});
}

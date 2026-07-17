/**
 * 斜杠命令(design.md W5;TUI 平权批接入 pi 命令源)。
 * 本地命令:
 *   /new     新会话 · /clear 清空排队 · /export 原生 HTML 导出 · /compact 手动压缩
 * 远程命令(pi 三源:extension / prompt 模板 / skill):选中后把 `/name ` 填入
 * composer 供补参,回车后由 pi 的 `prompt()` 原生解析执行。
 * 远程命令与 /export /compact 依赖已物化 thread,新对话只有本地命令。
 *
 * ⚠️ Unstable_ API:官方标注 "may change without notice"(0.14.26)。
 * 已按任务包接受漂移风险,升级 assistant-ui 时需回归此文件。
 */
import { ComposerPrimitive, useAui, useAuiState } from "@assistant-ui/react";
import { usePiRuntimeExtras } from "@assistant-ui/react-pi";
import type { PiSlashCommand } from "@assistant-ui/react-pi";
import { unstable_useSlashCommandAdapter } from "@assistant-ui/react";
import { useEffect, useState, type FC } from "react";
import { piClient } from "../PiRuntimeProvider";

/** 下载 pi 原生自包含 HTML 会话文档。失败冒泡 console(fail fast)。 */
const exportSessionHtml = async (threadId: string): Promise<void> => {
  try {
    const html = await piClient.exportHtml(threadId);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pi-session-${threadId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("[pi-cockpit] 导出会话失败", error);
  }
};

/** pi 侧命令目录:thread 物化后拉取一次(命令目录会话期内稳定)。 */
const usePiCommands = (threadId: string | undefined): PiSlashCommand[] => {
  const [commands, setCommands] = useState<PiSlashCommand[]>([]);
  useEffect(() => {
    if (!threadId) {
      setCommands([]);
      return;
    }
    let alive = true;
    piClient
      .getCommands(threadId)
      .then((list) => {
        if (alive) setCommands(list);
      })
      .catch((error: unknown) => {
        console.error("[pi-cockpit] 加载 pi 命令目录失败", error);
      });
    return () => {
      alive = false;
    };
  }, [threadId]);
  return commands;
};

/** 弹层:包住 composer 输入区(TriggerPopover 需 Root 内 + 能读 input)。 */
export const SlashCommandRoot: FC<{ children: React.ReactNode }> = ({ children }) => {
  const aui = useAui();
  const { clearQueue } = usePiRuntimeExtras();
  const threadId = useAuiState((s) => s.threadListItem.remoteId);
  const piCommands = usePiCommands(threadId);

  const slash = unstable_useSlashCommandAdapter({
    commands: [
      {
        id: "new",
        label: "新对话",
        description: "开始一个新会话",
        execute: () => aui.threads().switchToNewThread(),
      },
      {
        id: "clear",
        label: "清空队列",
        description: "清空排队的消息",
        execute: () => {
          void clearQueue();
        },
      },
      ...(threadId
        ? [
            {
              id: "export",
              label: "导出会话",
              description: "下载 pi 原生 HTML 会话文档",
              execute: () => {
                void exportSessionHtml(threadId);
              },
            },
            {
              id: "compact",
              label: "压缩上下文",
              description: "手动触发上下文压缩",
              execute: () => {
                // 进度经事件流 compaction_start/end 显示在 ActivityBanner
                piClient.compact(threadId).catch((error: unknown) => {
                  console.error("[pi-cockpit] 手动压缩失败", error);
                });
              },
            },
            // pi 三源命令:选中即发送(pi prompt() 原生解析执行)。填入 composer
            // 供补参的方案不可行:文本以 / 开头时弹层常开,Enter 永被劫持。
            // 带参用法 = 手打全文("/pi-web-ui start"),空格后弹层失配关闭,
            // Enter 恢复正常发送。
            ...piCommands.map((command) => ({
              id: command.name,
              label: command.name,
              description: command.description ?? `pi ${command.source} 命令`,
              execute: () => {
                const composer = aui.composer();
                composer.setText(`/${command.name}`);
                composer.send();
              },
            })),
          ]
        : []),
    ],
    removeOnExecute: true,
  });

  return (
    <ComposerPrimitive.Unstable_TriggerPopoverRoot>
      {children}
      <ComposerPrimitive.Unstable_TriggerPopover
        char="/"
        adapter={slash.adapter}
        className="absolute bottom-full left-0 z-50 mb-2 max-h-72 w-72 overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-lg"
      >
        <ComposerPrimitive.Unstable_TriggerPopover.Action {...slash.action} />
        <ComposerPrimitive.Unstable_TriggerPopoverItems>
          {(items) =>
            items.map((item) => (
              <ComposerPrimitive.Unstable_TriggerPopoverItem
                key={item.id}
                item={item}
                className="flex w-full flex-col rounded-lg px-3 py-1.5 text-start transition-colors duration-200 hover:bg-surface-2 data-[highlighted]:bg-surface-2"
              >
                <span className="text-[14px] text-text">/{item.id}</span>
                {item.description && (
                  <span className="text-[12px] text-text-3">{item.description}</span>
                )}
              </ComposerPrimitive.Unstable_TriggerPopoverItem>
            ))
          }
        </ComposerPrimitive.Unstable_TriggerPopoverItems>
      </ComposerPrimitive.Unstable_TriggerPopover>
    </ComposerPrimitive.Unstable_TriggerPopoverRoot>
  );
};

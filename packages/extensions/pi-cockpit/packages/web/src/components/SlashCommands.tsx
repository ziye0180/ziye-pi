/**
 * 斜杠命令(design.md W5;实包 API 已核实)。
 * pi 无服务端 slash 执行 API,故命令全部映射 cockpit 本地动作:
 *   /new 新会话 · /clear 清空队列 · /export 导出会话 JSON
 * 用 unstable_useSlashCommandAdapter(commands.execute 是本地闭包回调)+
 * ComposerPrimitive.Unstable_TriggerPopover* 弹层。
 *
 * ⚠️ Unstable_ API:官方标注 "may change without notice"(0.14.26)。
 * 已按任务包接受漂移风险,升级 assistant-ui 时需回归此文件。
 */
import { ComposerPrimitive, useAui } from "@assistant-ui/react";
import { usePiRuntimeExtras } from "@assistant-ui/react-pi";
import { unstable_useSlashCommandAdapter } from "@assistant-ui/react";
import type { FC } from "react";

/** 导出当前会话为 JSON 文件。 */
const exportThread = (aui: ReturnType<typeof useAui>) => {
  try {
    const repo = aui.thread().export();
    const blob = new Blob([JSON.stringify(repo, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pi-cockpit-session.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("[pi-cockpit] 导出会话失败", error);
  }
};

/** 弹层:包住 composer 输入区(TriggerPopover 需 Root 内 + 能读 input)。 */
export const SlashCommandRoot: FC<{ children: React.ReactNode }> = ({ children }) => {
  const aui = useAui();
  const { clearQueue } = usePiRuntimeExtras();

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
      {
        id: "export",
        label: "导出会话",
        description: "下载当前会话 JSON",
        execute: () => exportThread(aui),
      },
    ],
    removeOnExecute: true,
  });

  return (
    <ComposerPrimitive.Unstable_TriggerPopoverRoot>
      {children}
      <ComposerPrimitive.Unstable_TriggerPopover
        char="/"
        adapter={slash.adapter}
        className="absolute bottom-full left-0 z-50 mb-2 w-64 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg"
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

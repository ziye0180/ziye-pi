/**
 * 会话侧栏(design.md「会话侧栏」规格 + M3 W5 会话管理)。
 * ThreadListPrimitive 驱动 react-pi 的 remote thread list(列表/切换/新建/删除/归档)。
 * 重命名无 primitive,走 useAui().threads().item({id}).rename() hooks 路线。
 * 注意:pi 无服务端标题总结(generateTitle 是 no-op),标题来自 session_info_changed。
 */
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAui,
  useAuiState,
} from "@assistant-ui/react";
import { ArchiveIcon, ArchiveRestoreIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState, type FC } from "react";

export const ThreadSidebar: FC = () => (
  <ThreadListPrimitive.Root className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-bg">
    <div className="p-2">
      <ThreadListPrimitive.New asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-[14px] text-text transition-colors duration-200 hover:bg-surface-2"
        >
          <PlusIcon className="size-4" />
          新建对话
        </button>
      </ThreadListPrimitive.New>
    </div>
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
      <ThreadListPrimitive.Items>{() => <ThreadItem />}</ThreadListPrimitive.Items>
      <ArchivedSection />
    </nav>
  </ThreadListPrimitive.Root>
);

/** 归档区:仅当有归档会话时显示(ThreadListPrimitive.Items archived)。 */
const ArchivedSection: FC = () => {
  const hasArchived = useAuiState((s) => s.threads.archivedThreadIds.length > 0);
  if (!hasArchived) return null;
  return (
    <div className="mt-4 border-t border-border pt-3">
      <div className="px-3 pb-1 text-[11px] font-medium text-text-3 uppercase">已归档</div>
      <ThreadListPrimitive.Items archived>
        {() => <ThreadItem archived />}
      </ThreadListPrimitive.Items>
    </div>
  );
};

const ThreadItem: FC<{ archived?: boolean }> = ({ archived = false }) => {
  const aui = useAui();
  const id = useAuiState((s) => s.threadListItem.id);
  const currentTitle = useAuiState((s) => s.threadListItem.title);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startRename = () => {
    setDraft(currentTitle ?? "");
    setEditing(true);
  };

  const commitRename = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== currentTitle) {
      try {
        aui.threads().item({ id }).rename(next);
      } catch (error) {
        console.error("[pi-cockpit] 重命名失败", error);
      }
    }
  };

  if (editing) {
    return (
      <div className="px-3 py-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-full rounded-md border border-border-strong bg-bg px-2 py-1 text-[14px] text-text outline-none"
        />
      </div>
    );
  }

  return (
    <ThreadListItemPrimitive.Root className="group flex items-center gap-1 rounded-[10px] px-3 py-2 transition-colors duration-200 hover:bg-surface data-[active]:bg-surface-2">
      <ThreadListItemPrimitive.Trigger className="min-w-0 flex-1 truncate text-start text-[14px] text-text-2 group-data-[active]:text-text">
        <ThreadListItemPrimitive.Title fallback="未命名对话" />
      </ThreadListItemPrimitive.Trigger>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {archived ? (
          <ThreadListItemPrimitive.Unarchive asChild>
            <button
              type="button"
              aria-label="取消归档"
              className="rounded-md p-1 text-text-3 transition-colors duration-200 hover:text-text"
            >
              <ArchiveRestoreIcon className="size-3.5" />
            </button>
          </ThreadListItemPrimitive.Unarchive>
        ) : (
          <>
            <button
              type="button"
              aria-label="重命名"
              onClick={startRename}
              className="rounded-md p-1 text-text-3 transition-colors duration-200 hover:text-text"
            >
              <PencilIcon className="size-3.5" />
            </button>
            <ThreadListItemPrimitive.Archive asChild>
              <button
                type="button"
                aria-label="归档"
                className="rounded-md p-1 text-text-3 transition-colors duration-200 hover:text-text"
              >
                <ArchiveIcon className="size-3.5" />
              </button>
            </ThreadListItemPrimitive.Archive>
          </>
        )}
        <ThreadListItemPrimitive.Delete asChild>
          <button
            type="button"
            aria-label="删除对话"
            className="rounded-md p-1 text-text-3 transition-colors duration-200 hover:text-danger"
          >
            <Trash2Icon className="size-3.5" />
          </button>
        </ThreadListItemPrimitive.Delete>
      </div>
    </ThreadListItemPrimitive.Root>
  );
};

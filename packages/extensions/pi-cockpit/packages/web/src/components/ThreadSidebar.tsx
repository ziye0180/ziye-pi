/**
 * 会话侧栏(design.md「会话侧栏」规格)。
 * assistant-ui ThreadListPrimitive 驱动 react-pi 的 remote thread list——
 * 会话列表、切换、新建、删除全部走 usePiRuntime 内建的 useRemoteThreadListRuntime,
 * 刷新后 bridge 侧线程仍在,列表自动重建、点击切回历史(read-only 快照)。
 */
import { ThreadListItemPrimitive, ThreadListPrimitive } from "@assistant-ui/react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import type { FC } from "react";

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
    </nav>
  </ThreadListPrimitive.Root>
);

const ThreadItem: FC = () => (
  <ThreadListItemPrimitive.Root className="group flex items-center gap-1 rounded-[10px] px-3 py-2 transition-colors duration-200 hover:bg-surface data-[active]:bg-surface-2">
    <ThreadListItemPrimitive.Trigger className="min-w-0 flex-1 truncate text-start text-[14px] text-text-2 group-data-[active]:text-text">
      <ThreadListItemPrimitive.Title fallback="未命名对话" />
    </ThreadListItemPrimitive.Trigger>
    <ThreadListItemPrimitive.Delete asChild>
      <button
        type="button"
        aria-label="删除对话"
        className="shrink-0 rounded-md p-1 text-text-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:text-danger"
      >
        <Trash2Icon className="size-3.5" />
      </button>
    </ThreadListItemPrimitive.Delete>
  </ThreadListItemPrimitive.Root>
);

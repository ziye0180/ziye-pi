/**
 * 附件 UI(design.md 消息操作+附件,M3 W4)。
 * adapters.attachments 已在 PiRuntimeProvider 装配(image + text);
 * 这里只画 composer 待发附件区、选文件按钮、消息侧回显。
 * 用 children render 函数(components prop 在 0.14 已 @deprecated);
 * 缩略图 primitive 真名为 unstable_Thumb。
 */
import { AttachmentPrimitive, ComposerPrimitive, MessagePrimitive } from "@assistant-ui/react";
import { PaperclipIcon, XIcon } from "lucide-react";
import type { FC } from "react";

const AttachmentCard: FC = () => (
  <AttachmentPrimitive.Root className="group relative flex items-center gap-2 rounded-[10px] border border-border bg-surface-2 px-2 py-1.5 text-[12px] text-text-2">
    <AttachmentPrimitive.unstable_Thumb className="size-8 shrink-0 overflow-hidden rounded bg-bg [&_img]:size-full [&_img]:object-cover" />
    <span className="max-w-32 truncate">
      <AttachmentPrimitive.Name />
    </span>
    <AttachmentPrimitive.Remove asChild>
      <button
        type="button"
        aria-label="移除附件"
        className="ms-1 rounded p-0.5 text-text-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:text-danger"
      >
        <XIcon className="size-3.5" />
      </button>
    </AttachmentPrimitive.Remove>
  </AttachmentPrimitive.Root>
);

/** composer 待发附件行(有附件才显示)。 */
export const ComposerAttachments: FC = () => (
  <ComposerPrimitive.Attachments>
    {() => <AttachmentCard />}
  </ComposerPrimitive.Attachments>
);

/** 选文件按钮(composer 左下,回形针)。 */
export const ComposerAddAttachment: FC = () => (
  <ComposerPrimitive.AddAttachment asChild>
    <button
      type="button"
      aria-label="添加附件"
      className="flex size-8 items-center justify-center rounded-md text-text-3 transition-colors duration-200 hover:text-text"
    >
      <PaperclipIcon className="size-4" />
    </button>
  </ComposerPrimitive.AddAttachment>
);

/** 用户消息里的附件回显(图片缩略图)。 */
export const UserMessageAttachments: FC = () => (
  <MessagePrimitive.Attachments>
    {() => (
      <AttachmentPrimitive.Root className="overflow-hidden rounded-(--radius-bubble) border border-border">
        <AttachmentPrimitive.unstable_Thumb className="[&_img]:max-h-64 [&_img]:max-w-full" />
      </AttachmentPrimitive.Root>
    )}
  </MessagePrimitive.Attachments>
);

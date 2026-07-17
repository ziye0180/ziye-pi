/**
 * 附件 UI(design.md 消息操作+附件;对齐官方 attachments guide 的缩略图质感)。
 * adapters.attachments 已在 PiRuntimeProvider 装配(image + text)。
 *
 * 0.14.26 的 AttachmentPrimitive.unstable_Thumb 只渲染扩展名徽章(官方文档
 * 截图里的图片预览是其组件包自绘的),所以缩略图在这里自绘:
 * composer 阶段(pending)用 File 的 objectURL(卸载时回收),发送后
 * (complete)用 content 里的 image dataURL。
 */
import {
  AttachmentPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useAuiState,
} from "@assistant-ui/react";
import { FileTextIcon, PaperclipIcon, XIcon } from "lucide-react";
import { useEffect, useState, type FC } from "react";

/** 附件的可显示图片源;非图片附件返回 undefined。 */
const useAttachmentSrc = (): string | undefined => {
  const file = useAuiState((s) => (s.attachment as { file?: File }).file);
  const content = useAuiState(
    (s) => (s.attachment as { content?: readonly unknown[] }).content,
  );
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!(file instanceof File) || !file.type.startsWith("image/")) {
      setObjectUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (objectUrl) return objectUrl;
  const imagePart = content?.find(
    (part): part is { type: "image"; image: string } =>
      typeof part === "object" &&
      part !== null &&
      (part as { type?: string }).type === "image" &&
      typeof (part as { image?: unknown }).image === "string",
  );
  return imagePart?.image;
};

/** 卡片内容:图片铺满,非图片用文档图标。 */
const AttachmentThumb: FC = () => {
  const src = useAttachmentSrc();
  const name = useAuiState((s) => s.attachment.name);
  if (src) {
    return <img src={src} alt={name} className="size-full object-cover" />;
  }
  return <FileTextIcon className="size-6 text-text-3" />;
};

/** composer 待发附件卡:方形缩略图 + 右上角移除角标(官方 guide 质感)。 */
const AttachmentCard: FC = () => {
  const name = useAuiState((s) => s.attachment.name);
  return (
    <AttachmentPrimitive.Root className="relative" title={name}>
      <div className="flex size-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-2">
        <AttachmentThumb />
      </div>
      <AttachmentPrimitive.Remove asChild>
        <button
          type="button"
          aria-label="移除附件"
          className="absolute -top-1.5 -end-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-surface text-text-2 shadow-sm transition-colors duration-200 hover:text-danger"
        >
          <XIcon className="size-3" />
        </button>
      </AttachmentPrimitive.Remove>
    </AttachmentPrimitive.Root>
  );
};

/** composer 待发附件行(有附件才显示,横排换行)。 */
export const ComposerAttachments: FC = () => (
  <div className="flex flex-wrap gap-2.5 empty:hidden">
    <ComposerPrimitive.Attachments>
      {() => <AttachmentCard />}
    </ComposerPrimitive.Attachments>
  </div>
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

/** 用户消息里的单个附件:图片直接展示,文档显示名片。 */
const MessageAttachmentView: FC = () => {
  const src = useAttachmentSrc();
  const name = useAuiState((s) => s.attachment.name);
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="max-h-64 max-w-full rounded-(--radius-bubble) border border-border"
      />
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-(--radius-bubble) border border-border bg-surface-2 px-3 py-2 text-[12px] text-text-2">
      <FileTextIcon className="size-4 shrink-0" />
      <span className="max-w-40 truncate">{name}</span>
    </div>
  );
};

/** 用户消息里的附件回显(右对齐,与 user 气泡同侧)。 */
export const UserMessageAttachments: FC = () => (
  <div className="flex flex-wrap justify-end gap-2 empty:hidden">
    <MessagePrimitive.Attachments>
      {() => <MessageAttachmentView />}
    </MessagePrimitive.Attachments>
  </div>
);

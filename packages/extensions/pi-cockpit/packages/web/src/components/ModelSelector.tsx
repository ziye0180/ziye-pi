/**
 * 模型 / thinking 选择器(design.md「模型选择器」规格)。
 * 模型目录经 bridge GET /api/pi/models 拉取一次;当前选中与切换走
 * usePiRuntimeExtras 的 metadata.config / setModel / setThinkingLevel
 * (react-pi 已把当前 thread 绑好,调用只传业务参数)。
 *
 * 新对话(thread 未物化)时 react-pi 的 controller 是 NOOP,setModel 会被
 * 静默吞掉:此时先把选择暂存,调 threadListItem().initialize() 物化空
 * thread(react-pi 首条消息同款路径),待真 controller 挂上后再应用。
 */
import { useAui, useAuiState } from "@assistant-ui/react";
import { usePiRuntimeExtras } from "@assistant-ui/react-pi";
import type { PiModelInfo } from "@assistant-ui/react-pi";
import { CheckIcon } from "lucide-react";
import { useEffect, useRef, useState, type FC } from "react";

/** 暂存的模型选择(仅新对话物化窗口期使用)。 */
type PendingModel = { provider: string; modelId: string };

/** 一次性拉取 bridge 的模型目录;失败冒泡到 console(fail fast,不静默兜底成空)。
 * 类型直接复用 react-pi 导出的 PiModelInfo,避免本地孪生类型漂移。 */
const useModelCatalog = (): PiModelInfo[] => {
  const [models, setModels] = useState<PiModelInfo[]>([]);
  useEffect(() => {
    let alive = true;
    fetch("/api/pi/models")
      .then((r) => {
        if (!r.ok) throw new Error(`GET /models ${r.status}`);
        return r.json() as Promise<PiModelInfo[]>;
      })
      .then((data) => {
        if (alive) setModels(data);
      })
      .catch((error: unknown) => {
        console.error("[pi-cockpit] 加载模型目录失败", error);
      });
    return () => {
      alive = false;
    };
  }, []);
  return models;
};

export const ModelSelector: FC = () => {
  const aui = useAui();
  const isNewThread = useAuiState((s) => s.threadListItem.status === "new");
  const { metadata, setModel, setThinkingLevel, status } = usePiRuntimeExtras();
  const models = useModelCatalog();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<PendingModel | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // thread 物化 + 真 controller 就绪后应用暂存选择。
  // 就绪信号必须用 metadata.config(来自真 thread snapshot):isNewThread 翻转
  // 那一拍 extras 可能仍是 NOOP controller,提前调 setModel 会被静默吞掉。
  const configReady = metadata.config !== undefined;
  useEffect(() => {
    if (!pending || isNewThread || !configReady) return;
    setModel(pending)
      .catch((error: unknown) => {
        console.error("[pi-cockpit] 应用暂存模型失败", error);
      })
      .finally(() => setPending(null)); // refresh 后再清,避免 label 闪回旧值
  }, [pending, isNewThread, configReady, setModel]);

  const choose = (m: PiModelInfo): void => {
    if (isNewThread) {
      // NOOP controller 窗口:暂存 + 物化空 thread,useEffect 收尾
      setPending({ provider: m.provider, modelId: m.modelId });
      aui
        .threadListItem()
        .initialize()
        .catch((error: unknown) => {
          setPending(null); // fail fast:物化失败不留假回显
          console.error("[pi-cockpit] 初始化会话失败", error);
        });
    } else {
      void setModel({ provider: m.provider, modelId: m.modelId });
    }
    setOpen(false);
  };

  const running = status === "running";
  const provider = pending?.provider ?? metadata.config?.provider;
  const modelId = pending?.modelId ?? metadata.config?.modelId;
  const level = metadata.config?.thinkingLevel;
  const current = models.find(
    (m) => m.provider === provider && m.modelId === modelId,
  );
  const label = modelId
    ? `${modelId}${typeof level === "string" && level !== "off" ? ` · ${level}` : ""}`
    : "选择模型";

  // 点击面板外关闭
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (models.length === 0) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={running}
        onClick={() => setOpen((v) => !v)}
        className="max-w-52 truncate rounded-md px-2 py-1 text-[13px] text-text-2 transition-colors duration-200 hover:text-text disabled:text-text-3"
      >
        {label}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-60 rounded-xl border border-border bg-surface p-1.5 shadow-lg">
          <div className="max-h-56 overflow-y-auto">
            {models.map((m) => {
              const active = m.provider === provider && m.modelId === modelId;
              return (
                <button
                  key={`${m.provider}/${m.modelId}`}
                  type="button"
                  onClick={() => choose(m)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-[13px] text-text-2 transition-colors duration-200 hover:bg-surface-2 hover:text-text"
                >
                  <CheckIcon
                    className={`size-3.5 shrink-0 ${active ? "text-text" : "text-transparent"}`}
                  />
                  <span className="truncate">{m.name ?? m.modelId}</span>
                </button>
              );
            })}
          </div>
          {current?.supportsThinking && (
            <div className="mt-1.5 flex flex-wrap gap-1 border-t border-border pt-2">
              {(current.availableThinkingLevels ?? []).map((lvl) => {
                const on = level === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => void setThinkingLevel(lvl)}
                    className={`rounded-full px-2 py-0.5 text-[12px] transition-colors duration-200 ${
                      on ? "bg-surface-2 text-text" : "text-text-3 hover:text-text-2"
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 模型 / thinking 选择器(design.md「模型选择器」规格)。
 * 模型目录经 bridge GET /api/pi/models 拉取一次;当前选中与切换走
 * usePiRuntimeExtras 的 metadata.config / setModel / setThinkingLevel
 * (react-pi 已把当前 thread 绑好,调用只传业务参数)。
 */
import { usePiRuntimeExtras } from "@assistant-ui/react-pi";
import type { PiThinkingLevel } from "@assistant-ui/react-pi";
import { CheckIcon } from "lucide-react";
import { useEffect, useRef, useState, type FC } from "react";

type ModelInfo = {
  provider: string;
  modelId: string;
  name?: string;
  supportsThinking?: boolean;
  availableThinkingLevels?: readonly PiThinkingLevel[];
};

/** 一次性拉取 bridge 的模型目录;失败冒泡到 console(fail fast,不静默兜底成空)。 */
const useModelCatalog = (): ModelInfo[] => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  useEffect(() => {
    let alive = true;
    fetch("/api/pi/models")
      .then((r) => {
        if (!r.ok) throw new Error(`GET /models ${r.status}`);
        return r.json() as Promise<ModelInfo[]>;
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
  const { metadata, setModel, setThinkingLevel, status } = usePiRuntimeExtras();
  const models = useModelCatalog();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const running = status === "running";
  const provider = metadata.config?.provider;
  const modelId = metadata.config?.modelId;
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
                  onClick={() => {
                    void setModel({ provider: m.provider, modelId: m.modelId });
                    setOpen(false);
                  }}
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

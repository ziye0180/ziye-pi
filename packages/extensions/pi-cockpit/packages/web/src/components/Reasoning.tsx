/**
 * thinking 折叠块(design.md:运行中自动展开、结束自动收起、用户手动优先)。
 */
import { ChevronRightIcon } from "lucide-react";
import { useEffect, useState, type FC, type ReactNode } from "react";

export const ReasoningGroup: FC<{ running: boolean; children: ReactNode }> = ({
  running,
  children,
}) => {
  const [open, setOpen] = useState(running);
  const [userToggled, setUserToggled] = useState(false);

  useEffect(() => {
    if (!userToggled) setOpen(running);
  }, [running, userToggled]);

  return (
    <div className="my-1 text-[13px] text-text-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setUserToggled(true);
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors duration-200 hover:text-text"
      >
        <ChevronRightIcon
          className="size-3.5 transition-transform duration-250 ease-(--ease-cockpit) data-[open=true]:rotate-90"
          data-open={open}
        />
        <span className={running ? "animate-pulse-dot" : ""}>Thinking</span>
      </button>
      <div className="collapse-grid" data-open={open} aria-busy={running}>
        <div>
          <div className="ms-1.5 mt-1 border-s-2 border-border ps-3 leading-relaxed whitespace-pre-wrap">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReasoningPart: FC<{ text: string }> = ({ text }) => <>{text}</>;

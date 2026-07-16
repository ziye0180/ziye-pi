/**
 * host-UI 审批面(design.md「审批卡」)。
 * pi 无内置权限系统,唯一的 human-in-the-loop 是工具/扩展调
 * ctx.ui.confirm/select/input/editor;react-pi 把这些阻塞请求经
 * usePiHostUiRequests 暴露(重连后仍在,挂在 supervisor 记录上)。
 * 本组件渲染队首一个并回传响应。逻辑参照官方 examples/with-pi HostUiRequestCard。
 */
import {
  responseForRequest,
  usePiHostUiRequests,
  type PiHostUiRequest,
} from "@assistant-ui/react-pi";
import { useState, type FC } from "react";

type Respond = ReturnType<typeof usePiHostUiRequests>["respond"];

export const HostUiRequests: FC = () => {
  const { requests, respond } = usePiHostUiRequests();
  const request = requests[0];
  if (!request) return null;
  return <HostUiCard key={request.id} request={request} respond={respond} />;
};

const HostUiCard: FC<{ request: PiHostUiRequest; respond: Respond }> = ({
  request,
  respond,
}) => {
  const [value, setValue] = useState(
    request.kind === "editor" ? (request.prefill ?? "") : "",
  );

  const dismiss = () =>
    void respond(
      request.kind === "confirm"
        ? responseForRequest(request, false)
        : { requestId: request.id, dismissed: true },
    );

  const submit = () =>
    request.kind === "confirm"
      ? void respond(responseForRequest(request, true))
      : void respond(responseForRequest(request, value));

  return (
    <div className="rounded-(--radius-card) border border-border bg-surface p-3 text-[13px]">
      <div className="text-[14px] font-medium text-text">{request.title}</div>

      {request.kind === "confirm" ? (
        <p className="mt-1 text-text-2">{request.message}</p>
      ) : request.kind === "select" ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {request.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => void respond(responseForRequest(request, option))}
              className="rounded-full border border-border bg-surface-2 px-3 py-1 text-text-2 transition-colors duration-200 hover:text-text"
            >
              {option}
            </button>
          ))}
        </div>
      ) : request.kind === "editor" ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          className="mt-2 min-h-24 w-full resize-y rounded-md border border-border bg-bg p-2 font-mono text-[12px] text-text outline-none"
        />
      ) : (
        <input
          value={value}
          placeholder={request.placeholder}
          onChange={(e) => setValue(e.currentTarget.value)}
          className="mt-2 w-full rounded-md border border-border bg-bg px-2 py-1 text-text outline-none placeholder:text-text-3"
        />
      )}

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md px-3 py-1 text-text-2 transition-colors duration-200 hover:text-text"
        >
          {request.kind === "confirm" ? "拒绝" : "取消"}
        </button>
        {request.kind !== "select" && (
          <button
            type="button"
            onClick={submit}
            className="rounded-md bg-accent px-3 py-1 text-accent-fg transition-opacity duration-200"
          >
            {request.kind === "confirm" ? "批准" : "提交"}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * react-pi 官方 wire 契约的 Hono 实现(SSOT: @assistant-ui/react-pi
 * src/client/httpClient.ts 头注释的 15 端点表,不得私改 shape)。
 *
 * 错误处理:fail fast —— 任何异常 500 + JSON {error},createPiHttpClient 会把
 * 文本原样冒泡到 UI;不吞错、不兜底。
 *
 * 边界解析策略:请求体(input/level/response/setModel 等)信任唯一契约 client
 * (react-pi createPiHttpClient),不逐字段预校验;SDK 对非法输入自会抛错经 onError
 * 冒泡 500。仅对会写入持久状态的 rename title 做非空校验,POST /threads 做 JSON 合法性校验。
 */
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { PiClientEvent } from "@assistant-ui/react-pi";
import { piClient } from "./pi-client.js";
import { SSE_HEARTBEAT_MS } from "./env.js";

export const api = new Hono();

api.onError((error, c) => {
  return c.json(
    { error: error instanceof Error ? error.message : String(error) },
    500,
  );
});

const badRequest = (message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });

const noContent = () => new Response(null, { status: 204 });

// ── threads ──────────────────────────────────────────────────────────────

api.get("/threads", async (c) => {
  const workspacePath = c.req.query("workspacePath");
  const includeArchived = c.req.query("includeArchived") === "true";
  const threads = await piClient.listThreads({
    ...(workspacePath ? { workspacePath } : {}),
    includeArchived,
  });
  return c.json(threads);
});

api.post("/threads", async (c) => {
  // 畸形 JSON 不静默兜底成 {}(fail fast);合法空 body 由 client 发 {}
  const parsed = await c.req
    .json()
    .then((body) => ({ ok: true as const, body }))
    .catch(() => ({ ok: false as const, body: undefined }));
  if (!parsed.ok) return badRequest("请求体不是合法 JSON");
  return c.json(await piClient.createThread(parsed.body));
});

api.get("/threads/:id", async (c) => {
  return c.json(await piClient.getThread(c.req.param("id")));
});

api.patch("/threads/:id", async (c) => {
  const { title } = (await c.req.json()) as { title?: unknown };
  if (typeof title !== "string" || title.trim() === "") {
    return badRequest("title must be a non-empty string");
  }
  await piClient.renameThread(c.req.param("id"), title);
  return noContent();
});

api.delete("/threads/:id", async (c) => {
  await piClient.deleteThread(c.req.param("id"));
  return noContent();
});

// ── run 控制 ────────────────────────────────────────────────────────────

api.post("/threads/:id/messages", async (c) => {
  const { input } = await c.req.json();
  await piClient.sendMessage(c.req.param("id"), input);
  return noContent();
});

api.post("/threads/:id/cancel", async (c) => {
  await piClient.cancelRun(c.req.param("id"));
  return noContent();
});

api.post("/threads/:id/queue/clear", async (c) => {
  return c.json(await piClient.clearQueue(c.req.param("id")));
});

// ── 模型与配置 ──────────────────────────────────────────────────────────

api.get("/models", async (c) => {
  const workspacePath = c.req.query("workspacePath");
  return c.json(
    await piClient.getAvailableModels(
      workspacePath ? { workspacePath } : undefined,
    ),
  );
});

api.post("/threads/:id/model", async (c) => {
  await piClient.setModel(c.req.param("id"), await c.req.json());
  return noContent();
});

api.post("/threads/:id/thinking", async (c) => {
  const { level } = await c.req.json();
  await piClient.setThinkingLevel(c.req.param("id"), level);
  return noContent();
});

// ── 归档 / host-ui ─────────────────────────────────────────────────────

api.post("/threads/:id/archive", async (c) => {
  await piClient.archiveThread(c.req.param("id"));
  return noContent();
});

api.post("/threads/:id/unarchive", async (c) => {
  await piClient.unarchiveThread(c.req.param("id"));
  return noContent();
});

api.post("/threads/:id/host-ui", async (c) => {
  const { response } = await c.req.json();
  await piClient.respondToHostUiRequest(c.req.param("id"), response);
  return noContent();
});

// ── SSE 事件流 ──────────────────────────────────────────────────────────
// 快照优先;?snapshot=false 仅收后续事件。客户端断开只退订,绝不 abort run。

api.get("/threads/:id/events", (c) => {
  const threadId = c.req.param("id");
  const includeSnapshot = c.req.query("snapshot") !== "false";

  return streamSSE(c, async (stream) => {
    let unsubscribe: (() => void) | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    try {
      const finished = new Promise<void>((resolve) => {
        stream.onAbort(resolve);
      });

      // 立即冲开缓冲代理
      await stream.write(": connected\n\n");
      heartbeat = setInterval(() => {
        void stream.write(": ping\n\n");
      }, SSE_HEARTBEAT_MS);

      unsubscribe = piClient.subscribe(
        threadId,
        (event: PiClientEvent) => {
          void stream.writeSSE({ data: JSON.stringify(event) });
        },
        { includeSnapshot },
      );

      await finished;
    } finally {
      // 结构性清理:正常结束/abort/回调抛错都执行,免疫 heartbeat interval 泄漏
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe?.();
    }
  });
});

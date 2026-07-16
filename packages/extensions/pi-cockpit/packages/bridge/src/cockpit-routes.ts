/**
 * cockpit 自有端点(挂 /api/cockpit/*,与 react-pi 的 /api/pi 契约隔离,M3 W5)。
 * 目前只有反馈落盘:把消息级点赞/点踩写进项目 .data/feedback.jsonl。
 */
import { Hono } from "hono";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { workspacePath } from "./pi-client.js";

export const cockpit = new Hono();

const feedbackFile = join(workspacePath, ".data", "feedback.jsonl");

cockpit.post("/feedback", async (c) => {
  const body = (await c.req.json().catch(() => null)) as
    | { messageId?: unknown; type?: unknown }
    | null;
  if (
    !body ||
    typeof body.messageId !== "string" ||
    (body.type !== "positive" && body.type !== "negative")
  ) {
    return new Response(JSON.stringify({ error: "invalid feedback" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const line = JSON.stringify({
    messageId: body.messageId,
    type: body.type,
    at: new Date().toISOString(),
  });
  await mkdir(dirname(feedbackFile), { recursive: true });
  await appendFile(feedbackFile, `${line}\n`, "utf8");
  return new Response(null, { status: 204 });
});

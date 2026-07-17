/**
 * pi-cockpit 桥接进程入口。
 *
 * 职责:把进程内 pi SDK(createPiNodeClient)经 react-pi 官方 HTTP/SSE 契约
 * 暴露在 127.0.0.1,供 web 前端(vite dev proxy 或生产静态页)消费。
 */
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { api } from "./routes.js";
import { HOST, PORT } from "./env.js";
import { startupSummary } from "./pi-client.js";

// 进程级边界:第三方 pi 扩展的异步逃逸(如 pi-mcp-adapter 对 ctx.ui.custom()
// 的 rejection 不 catch)不允许炸掉承载全部会话的常驻 bridge。错误结构化
// 记日志后继续运行 —— 这是服务边界的集中处理,不是业务层兜底。
process.on("unhandledRejection", (reason) => {
  console.error("[pi-cockpit bridge] unhandled rejection:", reason);
});

const app = new Hono();
app.route("/api/pi", api);
app.get("/healthz", (c) => c.json({ ok: true }));

serve({ fetch: app.fetch, hostname: HOST, port: PORT }, (info) => {
  // 启动横幅是运维必要输出,非调试残留
  console.log(`[pi-cockpit bridge] http://${info.address}:${info.port}`);
  console.log(`[pi-cockpit bridge] ${startupSummary()}`);
});

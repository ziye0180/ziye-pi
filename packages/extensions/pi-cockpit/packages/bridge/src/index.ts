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

const app = new Hono();
app.route("/api/pi", api);
app.get("/healthz", (c) => c.json({ ok: true }));

serve({ fetch: app.fetch, hostname: HOST, port: PORT }, (info) => {
  // 启动横幅是运维必要输出,非调试残留
  console.log(`[pi-cockpit bridge] http://${info.address}:${info.port}`);
  console.log(`[pi-cockpit bridge] ${startupSummary()}`);
});

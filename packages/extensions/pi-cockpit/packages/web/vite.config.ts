import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// 仅绑 127.0.0.1:与 bridge 同纪律,不对局域网暴露
// bridge 端口与 bridge/src/env.ts 的 PI_COCKPIT_PORT 同源,避免双源漂移
const bridgePort = process.env["PI_COCKPIT_PORT"] ?? "31460";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      // 整个 /api 走 bridge:/api/pi(react-pi 契约,含 SSE)+ /api/cockpit(自有端点)
      // http-proxy 对流式响应原生支持
      "/api": {
        target: `http://127.0.0.1:${bridgePort}`,
        changeOrigin: false,
      },
    },
  },
});

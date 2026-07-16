import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// 仅绑 127.0.0.1:与 bridge 同纪律,不对局域网暴露
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      // SSE 走同一 proxy;http-proxy 对流式响应原生支持
      "/api/pi": { target: "http://127.0.0.1:31460", changeOrigin: false },
    },
  },
});

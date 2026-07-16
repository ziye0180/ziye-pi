/**
 * 桥接进程配置 SSOT。
 *
 * HOST 写死 127.0.0.1:驾驶舱桥接持有对 pi SDK 的完全控制权(等价本机 shell 权限),
 * 绝不对局域网暴露(参见 isr4el pi-web-ui 0.0.0.0 零鉴权事故)。端口可经环境变量覆盖。
 */

const parsePort = (value: string | undefined, fallback: number): number => {
  if (!value || !value.trim()) return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PI_COCKPIT_PORT 非法: ${value}`);
  }
  return port;
};

export const HOST = "127.0.0.1" as const;
export const PORT = parsePort(process.env["PI_COCKPIT_PORT"], 31460);

/** SSE 心跳间隔:压在常见代理 30-60s 空闲超时之下。 */
export const SSE_HEARTBEAT_MS = 20_000;

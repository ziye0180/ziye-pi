/**
 * 进程单例 PiClient(pi SDK in-process)。
 *
 * 模型解析与 pi 自身的 createAgentSession 一致:显式 PI_PROVIDER + PI_MODEL_ID
 * 优先,否则回落到 pi 配置的默认模型(~/.pi/agent/settings.json 的
 * defaultProvider / defaultModel)。已用 `pi` 登录且选过默认模型的用户零 env 可跑。
 *
 * 仅由 routes 层 import;pi SDK 及其文件 IO 全部留在服务端。
 * 参考:assistant-ui monorepo examples/with-pi/lib/pi-server.ts。
 */
import {
  AuthStorage,
  ModelRegistry,
  SettingsManager,
} from "@earendil-works/pi-coding-agent";
import { createPiNodeClient } from "@assistant-ui/react-pi/node";

const env = (key: string): string | undefined => {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : undefined;
};

export const workspacePath = env("PI_WORKSPACE_PATH") ?? process.cwd();
const agentDir = env("PI_CODING_AGENT_DIR");

const authStorage = AuthStorage.create(
  agentDir ? `${agentDir}/auth.json` : undefined,
);
const modelRegistry = ModelRegistry.create(authStorage);
const settingsManager = SettingsManager.create(workspacePath, agentDir);

const provider = env("PI_PROVIDER") ?? settingsManager.getDefaultProvider();
const modelId = env("PI_MODEL_ID") ?? settingsManager.getDefaultModel();

const seededModel =
  provider && modelId ? modelRegistry.find(provider, modelId) : undefined;

export const piClient = createPiNodeClient({
  workspacePath,
  ...(agentDir ? { agentDir } : {}),
  ...(seededModel ? { model: seededModel } : {}),
});

export const startupSummary = (): string =>
  [
    `workspace: ${workspacePath}`,
    `model: ${provider ?? "?"}/${modelId ?? "?"}${seededModel ? "" : "(未在注册表命中,readiness 会报告)"}`,
  ].join("  |  ");

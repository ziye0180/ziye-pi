// Browser-safe entry. MUST NOT import `@earendil-works/pi-*` — only `src/node/`
// may, and it is reachable only from the `./node` entry.

export * from "./types.js";
export { piQueueItemId, isPiSteerQueueItemId } from "./queueIds.js";
export type { PiQueueMode } from "./queueIds.js";

export {
  createPiThreadState,
  reducePiThreadState,
} from "./runtime/threadState.js";
export type {
  PiThreadState,
  PiRunStatus,
  PiLoadState,
  PiToolExecutionState,
} from "./runtime/threadState.js";

export {
  projectPiThreadMessages,
  projectPiThreadRepository,
} from "./runtime/messageProjection.js";
export type {
  PiProjectionInput,
  PiProjectedContentPart,
} from "./runtime/messageProjection.js";

export {
  splitHostUiRequests,
  responseForApproval,
  responseForInterrupt,
  responseForRequest,
} from "./runtime/hostUi.js";
export type { SplitHostUiRequests, PiInterruptAnswer } from "./runtime/hostUi.js";

export { PiThreadController } from "./runtime/ThreadController.js";
export type {
  PiThreadControllerLike,
  PiSendOptions,
} from "./runtime/ThreadController.js";

export { usePiRuntime } from "./runtime/usePiRuntime.js";
export {
  usePiRuntimeExtras,
  usePiSession,
  usePiThreadState,
  usePiHostUiRequests,
} from "./runtime/hooks.js";
export type { PiRuntimeOptions, PiRuntimeExtras } from "./runtime/runtimeTypes.js";

export { createPiHttpClient } from "./client/httpClient.js";
export type { PiHttpClientOptions } from "./client/httpClient.js";

export { createSseDecoder, openPiEventStream } from "./client/eventSource.js";
export type { SseFrame, PiEventStreamOptions } from "./client/eventSource.js";

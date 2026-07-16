import { PiRuntimeProvider } from "./PiRuntimeProvider";
import { ThreadSidebar } from "./components/ThreadSidebar";
import { Thread } from "./components/Thread";

export function App() {
  return (
    <PiRuntimeProvider>
      <div className="flex h-dvh bg-bg text-text">
        <ThreadSidebar />
        <div className="min-w-0 flex-1">
          <Thread />
        </div>
      </div>
    </PiRuntimeProvider>
  );
}

import { PiRuntimeProvider } from "./PiRuntimeProvider";
import { Thread } from "./components/Thread";

export function App() {
  return (
    <PiRuntimeProvider>
      <div className="h-dvh bg-bg text-text">
        <Thread />
      </div>
    </PiRuntimeProvider>
  );
}

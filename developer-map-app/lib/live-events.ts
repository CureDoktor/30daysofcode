import { DeveloperPin } from "@/lib/types";

export type JoinEventPayload = {
  type: "developer-joined";
  marker: DeveloperPin;
  totalJoined: number;
};

type Listener = (event: JoinEventPayload) => void;

type LiveState = {
  listeners: Set<Listener>;
};

const globalLiveState = globalThis as unknown as { __liveState?: LiveState };

const state: LiveState = globalLiveState.__liveState ?? { listeners: new Set() };
globalLiveState.__liveState = state;

export function subscribeToLiveEvents(listener: Listener) {
  state.listeners.add(listener);

  return () => {
    state.listeners.delete(listener);
  };
}

export function publishJoinEvent(event: JoinEventPayload) {
  for (const listener of state.listeners) {
    listener(event);
  }
}

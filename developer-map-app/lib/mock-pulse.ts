import { incomingDevelopers } from "@/lib/mock-developers";

type MockPulseState = {
  index: number;
};

const globalState = globalThis as unknown as { __mockPulseState?: MockPulseState };
const state = globalState.__mockPulseState ?? { index: 0 };
globalState.__mockPulseState = state;

export function nextMockComment() {
  if (state.index >= incomingDevelopers.length) {
    return null;
  }

  const next = incomingDevelopers[state.index];
  state.index += 1;

  return {
    username: next.username,
    text: next.country,
    sourceRef: `mock-${next.id}`,
  };
}

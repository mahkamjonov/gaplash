"use server";

import { IS_MOCK_MODE } from "@/config/app";
import { signOut } from "@/services/auth";
import { readMockState, writeMockState, type MockScenario } from "@/services/mock/store";

export async function signOutAction() {
  await signOut();
}

export async function setMockScenarioAction(scenario: MockScenario) {
  if (!IS_MOCK_MODE) return;

  const state = await readMockState();
  if (state) await writeMockState({ ...state, scenario });
}

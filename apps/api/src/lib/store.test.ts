import assert from "node:assert/strict";
import test from "node:test";
import { store } from "./store.js";

test("store can upsert profile and fetch latest twin", () => {
  const profile = store.upsertProfile({
    fullName: "Test User",
    email: `test-${Date.now()}@careertwin.ai`,
    currentRole: "Software Engineer",
    yearsExperience: 5,
    goals: ["Leadership", "AI depth"],
    locationPreference: "Remote"
  });

  const twin = store.saveTwin({
    profileId: profile.id,
    summary: "Twin summary",
    strengths: ["Leadership"],
    growthAreas: ["Storytelling"],
    confidence: { min: 0.6, max: 0.8 }
  });

  assert.equal(store.getProfile(profile.id)?.id, profile.id);
  assert.equal(store.latestTwinForProfile(profile.id)?.id, twin.id);
});

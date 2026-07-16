import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import type { Profile, SimulationScenario } from "../../types/domain.js";
import { simulationOutputSchema, type SimulationOutput } from "./ai.schemas.js";

const PROMPT_INJECTION_BLOCKLIST = ["ignore previous", "system prompt", "developer message", "jailbreak"];

function sanitizeInput(value: string): string {
  const lower = value.toLowerCase();
  if (PROMPT_INJECTION_BLOCKLIST.some((token) => lower.includes(token))) {
    return "Potential prompt injection content removed.";
  }
  return value;
}

function buildFallback(profile: Profile, scenarios: SimulationScenario[]): SimulationOutput {
  return simulationOutputSchema.parse({
    recommendation: `Prioritize the "${scenarios[0]?.name ?? "primary"}" path as a staged experiment with measurable checkpoints.`,
    assumptions: [
      "You can invest at least 6 focused hours weekly.",
      "You are willing to run a 30-day low-risk validation experiment."
    ],
    tradeoffs: [
      "Faster growth may increase short-term workload.",
      "Stability-focused choices may slow long-term upside."
    ],
    confidenceBand: { min: 0.58, max: 0.72 },
    scenarios: scenarios.map((scenario, index) => ({
      name: scenario.name,
      metrics: {
        salaryGrowth: index === 0 ? "Moderate to high over 12 months" : "Moderate over 12 months",
        skillGrowth: index === 0 ? "High due to focused upskilling" : "Moderate with steady trajectory",
        burnoutRisk: index === 0 ? "Medium" : "Low to medium",
        promotionProbability: index === 0 ? "Medium to high" : "Medium"
      }
    })),
    evidenceRefs: [
      { type: "user_input", detail: `${profile.fullName} goals and constraints from onboarding form.` },
      { type: "inferred", detail: "Comparative simulation model with conservative confidence calibration." }
    ]
  });
}

export async function runSimulationWithAi(profile: Profile, scenarios: SimulationScenario[]): Promise<SimulationOutput> {
  if (!env.GEMINI_API_KEY || env.AI_PROVIDER_PRIMARY !== "gemini") {
    return buildFallback(profile, scenarios);
  }

  try {
    const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const prompt = `
You are CareerTwin AI. Return strict JSON only.
Never use deterministic future claims.
Always provide assumptions, tradeoffs, confidenceBand, evidenceRefs.

Profile:
- Name: ${sanitizeInput(profile.fullName)}
- Current role: ${sanitizeInput(profile.currentRole)}
- Years experience: ${profile.yearsExperience}
- Goals: ${profile.goals.map(sanitizeInput).join(", ")}
- Location preference: ${sanitizeInput(profile.locationPreference)}

Scenarios:
${scenarios.map((scenario) => `- ${sanitizeInput(scenario.name)} | assumptions: ${scenario.assumptions.map(sanitizeInput).join("; ")}`).join("\n")}

Required JSON shape:
{
  "recommendation": "string",
  "assumptions": ["string"],
  "tradeoffs": ["string"],
  "confidenceBand": {"min": 0.0, "max": 1.0},
  "scenarios": [{"name":"string","metrics":{"salaryGrowth":"string","skillGrowth":"string","burnoutRisk":"string","promotionProbability":"string"}}],
  "evidenceRefs":[{"type":"user_input|imported_profile|market_signal|inferred","detail":"string"}]
}`.trim();

    const response = await client.models.generateContent({
      model: env.GEMINI_MODEL_REASONING,
      contents: prompt
    });

    const text = response.text?.trim() ?? "";
    const normalized = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(normalized);
    return simulationOutputSchema.parse(parsed);
  } catch (error) {
    logger.warn({ error }, "Gemini request failed, using fallback simulation output");
    return buildFallback(profile, scenarios);
  }
}

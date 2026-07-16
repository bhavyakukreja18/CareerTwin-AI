import { z } from "zod";

export const confidenceBandSchema = z.object({
  min: z.number().min(0).max(1),
  max: z.number().min(0).max(1)
});

export const simulationOutputSchema = z.object({
  recommendation: z.string().min(10),
  assumptions: z.array(z.string()).min(2),
  tradeoffs: z.array(z.string()).min(2),
  confidenceBand: confidenceBandSchema,
  scenarios: z
    .array(
      z.object({
        name: z.string(),
        metrics: z.object({
          salaryGrowth: z.string(),
          skillGrowth: z.string(),
          burnoutRisk: z.string(),
          promotionProbability: z.string()
        })
      })
    )
    .min(2),
  evidenceRefs: z
    .array(
      z.object({
        type: z.enum(["user_input", "imported_profile", "market_signal", "inferred"]),
        detail: z.string()
      })
    )
    .min(2)
});

export type SimulationOutput = z.infer<typeof simulationOutputSchema>;

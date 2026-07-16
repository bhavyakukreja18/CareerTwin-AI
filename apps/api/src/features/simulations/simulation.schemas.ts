import { z } from "zod";

export const simulationScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  assumptions: z.array(z.string().min(2)).min(1)
});

export const runSimulationSchema = z.object({
  profileId: z.string().uuid(),
  scenarios: z.array(simulationScenarioSchema).min(2).max(5)
});

import { Router, type Request, type Response } from "express";
import { runSimulationWithAi } from "../ai/ai.service.js";
import { store } from "../../lib/store.js";
import { runSimulationSchema } from "./simulation.schemas.js";

export const simulationRouter = Router();

simulationRouter.post("/run", async (req: Request, res: Response) => {
  const parsed = runSimulationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid simulation payload.", details: parsed.error.flatten() });
  }

  const profile = store.getProfile(parsed.data.profileId);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found for simulation." });
  }

  const aiResult = await runSimulationWithAi(profile, parsed.data.scenarios);
  const simulation = store.saveSimulation({
    profileId: profile.id,
    recommendation: aiResult.recommendation,
    assumptions: aiResult.assumptions,
    tradeoffs: aiResult.tradeoffs,
    confidenceBand: aiResult.confidenceBand,
    scenarios: aiResult.scenarios,
    evidenceRefs: aiResult.evidenceRefs
  });

  return res.status(201).json({ data: simulation });
});

simulationRouter.get("/profile/:profileId", (req: Request, res: Response) => {
  const data = store.listSimulations(String(req.params.profileId));
  return res.status(200).json({ data });
});

simulationRouter.get("/:simulationId", (req: Request, res: Response) => {
  const simulation = store.getSimulation(String(req.params.simulationId));
  if (!simulation) {
    return res.status(404).json({ error: "Simulation not found." });
  }
  return res.status(200).json({ data: simulation });
});

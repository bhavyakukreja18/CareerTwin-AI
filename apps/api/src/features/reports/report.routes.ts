import { Router, type Request, type Response } from "express";
import { store } from "../../lib/store.js";
import { generateReportSchema } from "./report.schemas.js";

export const reportRouter = Router();

reportRouter.post("/generate", (req: Request, res: Response) => {
  const parsed = generateReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid report request.", details: parsed.error.flatten() });
  }

  const profile = store.getProfile(parsed.data.profileId);
  const simulation = store.getSimulation(parsed.data.simulationId);
  if (!profile || !simulation) {
    return res.status(404).json({ error: "Profile or simulation not found for report generation." });
  }

  const report = store.saveReport({
    profileId: profile.id,
    simulationId: simulation.id,
    title: parsed.data.title,
    audience: parsed.data.audience,
    summary: `${simulation.recommendation} | Confidence ${simulation.confidenceBand.min.toFixed(2)}-${simulation.confidenceBand.max.toFixed(2)}`
  });

  return res.status(201).json({ data: report });
});

reportRouter.get("/profile/:profileId", (req: Request, res: Response) => {
  return res.status(200).json({ data: store.listReports(String(req.params.profileId)) });
});

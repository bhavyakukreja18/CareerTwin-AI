import { Router, type Request, type Response } from "express";
import { store } from "../../lib/store.js";

export const dashboardRouter = Router();

dashboardRouter.get("/:profileId", (req: Request, res: Response) => {
  const profile = store.getProfile(String(req.params.profileId));
  if (!profile) {
    return res.status(404).json({ error: "Profile not found for dashboard." });
  }

  const latestTwin = store.latestTwinForProfile(profile.id);
  const simulations = store.listSimulations(profile.id);
  const latestSimulation = simulations.at(-1) ?? null;
  const reports = store.listReports(profile.id);

  return res.status(200).json({
    data: {
      profile,
      latestTwin,
      latestSimulation,
      reportCount: reports.length,
      nextActions: [
        "Review assumptions with lowest confidence.",
        "Run one additional scenario with altered location preference.",
        "Generate a mentor-ready report for feedback."
      ]
    }
  });
});

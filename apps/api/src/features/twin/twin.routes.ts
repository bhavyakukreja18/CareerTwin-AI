import { Router, type Request, type Response } from "express";
import { store } from "../../lib/store.js";
import { buildTwinSchema } from "./twin.schemas.js";

export const twinRouter = Router();

twinRouter.post("/build", (req: Request, res: Response) => {
  const parsed = buildTwinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid twin build request.", details: parsed.error.flatten() });
  }

  const profile = store.getProfile(parsed.data.profileId);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found for twin generation." });
  }

  const twin = store.saveTwin({
    profileId: profile.id,
    summary: `${profile.fullName} is currently a ${profile.currentRole} with ${profile.yearsExperience} years of experience.`,
    strengths: profile.goals.slice(0, 2),
    growthAreas: ["Strategic prioritization", "Market positioning"],
    confidence: { min: 0.56, max: 0.74 }
  });

  return res.status(201).json({ data: twin });
});

twinRouter.get("/latest/:profileId", (req: Request, res: Response) => {
  const profileId = String(req.params.profileId);
  const twin = store.latestTwinForProfile(profileId);
  if (!twin) {
    return res.status(404).json({ error: "No twin found for profile." });
  }
  return res.status(200).json({ data: twin });
});

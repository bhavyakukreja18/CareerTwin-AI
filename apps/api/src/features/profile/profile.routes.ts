import { Router, type Request, type Response } from "express";
import { store } from "../../lib/store.js";
import { profileQuerySchema, upsertProfileSchema } from "./profile.schemas.js";

export const profileRouter = Router();

profileRouter.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ data: store.listProfiles() });
});

profileRouter.get("/:profileId", (req: Request, res: Response) => {
  const parsed = profileQuerySchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid profile id." });
  }
  const profile = store.getProfile(parsed.data.profileId);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found." });
  }
  return res.status(200).json({ data: profile });
});

profileRouter.put("/", (req: Request, res: Response) => {
  const parsed = upsertProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid profile payload.", details: parsed.error.flatten() });
  }
  const profile = store.upsertProfile(parsed.data);
  return res.status(200).json({ data: profile });
});

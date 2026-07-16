import { z } from "zod";

export const upsertProfileSchema = z.object({
  id: z.string().uuid().optional(),
  fullName: z.string().min(2),
  email: z.string().email(),
  currentRole: z.string().min(2),
  yearsExperience: z.number().int().min(0).max(50),
  goals: z.array(z.string().min(2)).min(1),
  locationPreference: z.string().min(2),
  linkedinUrl: z.string().url().optional()
});

export const profileQuerySchema = z.object({
  profileId: z.string().uuid()
});

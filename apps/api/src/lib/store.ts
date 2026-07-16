import { randomUUID } from "node:crypto";
import type { Profile, Report, SimulationResult, Twin } from "../types/domain.js";

const now = () => new Date().toISOString();

const profiles = new Map<string, Profile>();
const twins = new Map<string, Twin>();
const simulations = new Map<string, SimulationResult>();
const reports = new Map<string, Report>();

export const store = {
  upsertProfile(input: Omit<Profile, "id" | "createdAt" | "updatedAt"> & { id?: string }): Profile {
    const id = input.id ?? randomUUID();
    const existing = profiles.get(id);
    const profile: Profile = {
      id,
      fullName: input.fullName,
      email: input.email,
      currentRole: input.currentRole,
      yearsExperience: input.yearsExperience,
      goals: input.goals,
      locationPreference: input.locationPreference,
      linkedinUrl: input.linkedinUrl,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now()
    };
    profiles.set(id, profile);
    return profile;
  },
  getProfile(profileId: string): Profile | null {
    return profiles.get(profileId) ?? null;
  },
  listProfiles(): Profile[] {
    return [...profiles.values()];
  },
  saveTwin(input: Omit<Twin, "id" | "createdAt">): Twin {
    const twin: Twin = { ...input, id: randomUUID(), createdAt: now() };
    twins.set(twin.id, twin);
    return twin;
  },
  latestTwinForProfile(profileId: string): Twin | null {
    return [...twins.values()].filter((item) => item.profileId === profileId).at(-1) ?? null;
  },
  saveSimulation(input: Omit<SimulationResult, "id" | "createdAt">): SimulationResult {
    const simulation: SimulationResult = { ...input, id: randomUUID(), createdAt: now() };
    simulations.set(simulation.id, simulation);
    return simulation;
  },
  getSimulation(simulationId: string): SimulationResult | null {
    return simulations.get(simulationId) ?? null;
  },
  listSimulations(profileId: string): SimulationResult[] {
    return [...simulations.values()].filter((simulation) => simulation.profileId === profileId);
  },
  saveReport(input: Omit<Report, "id" | "createdAt" | "status">): Report {
    const report: Report = { ...input, id: randomUUID(), status: "ready", createdAt: now() };
    reports.set(report.id, report);
    return report;
  },
  listReports(profileId: string): Report[] {
    return [...reports.values()].filter((report) => report.profileId === profileId);
  }
};

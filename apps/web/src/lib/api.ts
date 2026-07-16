import type { Profile, Report, SimulationResult, Twin } from "@/types/domain";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Request failed");
  }

  const payload = (await response.json()) as { data: T };
  return payload.data;
}

export interface UpsertProfilePayload {
  fullName: string;
  email: string;
  currentRole: string;
  yearsExperience: number;
  goals: string[];
  locationPreference: string;
  linkedinUrl?: string;
}

export function upsertProfile(payload: UpsertProfilePayload): Promise<Profile> {
  return request<Profile>("/api/v1/profiles", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function buildTwin(profileId: string): Promise<Twin> {
  return request<Twin>("/api/v1/twin/build", {
    method: "POST",
    body: JSON.stringify({ profileId })
  });
}

export interface RunSimulationPayload {
  profileId: string;
  scenarios: Array<{
    id: string;
    name: string;
    assumptions: string[];
  }>;
}

export function runSimulation(payload: RunSimulationPayload): Promise<SimulationResult> {
  return request<SimulationResult>("/api/v1/simulations/run", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getDashboard(profileId: string): Promise<{
  profile: Profile;
  latestTwin: Twin | null;
  latestSimulation: SimulationResult | null;
  reportCount: number;
  nextActions: string[];
}> {
  return request(`/api/v1/dashboard/${profileId}`);
}

export function getReports(profileId: string): Promise<Report[]> {
  return request<Report[]>(`/api/v1/reports/profile/${profileId}`);
}

export function generateReport(payload: {
  profileId: string;
  simulationId: string;
  title: string;
  audience: "mentor" | "self" | "stakeholder";
}): Promise<Report> {
  return request<Report>("/api/v1/reports/generate", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  currentRole: string;
  yearsExperience: number;
  goals: string[];
  locationPreference: string;
  linkedinUrl?: string;
}

export interface Twin {
  id: string;
  profileId: string;
  summary: string;
  strengths: string[];
  growthAreas: string[];
  confidence: { min: number; max: number };
}

export interface SimulationResult {
  id: string;
  profileId: string;
  recommendation: string;
  assumptions: string[];
  tradeoffs: string[];
  confidenceBand: { min: number; max: number };
  scenarios: Array<{
    name: string;
    metrics: {
      salaryGrowth: string;
      skillGrowth: string;
      burnoutRisk: string;
      promotionProbability: string;
    };
  }>;
  evidenceRefs: Array<{
    type: "user_input" | "imported_profile" | "market_signal" | "inferred";
    detail: string;
  }>;
}

export interface Report {
  id: string;
  profileId: string;
  simulationId: string;
  title: string;
  audience: "mentor" | "self" | "stakeholder";
  summary: string;
  status: "ready";
}

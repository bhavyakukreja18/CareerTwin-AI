"use client";

import { useAuth } from "@clerk/nextjs";
import * as Tabs from "@radix-ui/react-tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { AuthControls } from "@/components/auth-controls";
import { OnboardingForm, type OnboardingValues } from "@/components/onboarding-form";
import { SimulationForm, type SimulationFormValues } from "@/components/simulation-form";
import { EmptyState, ErrorState, LoadingState, SuccessState } from "@/components/state-blocks";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  buildTwin,
  generateReport,
  getDashboard,
  getReports,
  runSimulation,
  upsertProfile
} from "@/lib/api";
import type { Profile, Report, SimulationResult, Twin } from "@/types/domain";

export default function Home() {
  const { isSignedIn } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [latestTwin, setLatestTwin] = useState<Twin | null>(null);
  const [latestSimulation, setLatestSimulation] = useState<SimulationResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", profile?.id],
    queryFn: () => getDashboard(profile!.id),
    enabled: Boolean(profile?.id)
  });

  const reportsQuery = useQuery({
    queryKey: ["reports", profile?.id],
    queryFn: () => getReports(profile!.id),
    enabled: Boolean(profile?.id)
  });

  const saveProfile = useMutation({
    mutationFn: async (values: OnboardingValues) => {
      const profilePayload = {
        fullName: values.fullName,
        email: values.email,
        currentRole: values.currentRole,
        yearsExperience: values.yearsExperience,
        goals: values.goals.split(",").map((goal) => goal.trim()).filter(Boolean),
        locationPreference: values.locationPreference,
        linkedinUrl: values.linkedinUrl
      };
      const savedProfile = await upsertProfile(profilePayload);
      const builtTwin = await buildTwin(savedProfile.id);
      return { savedProfile, builtTwin };
    },
    onSuccess: ({ savedProfile, builtTwin }) => {
      setProfile(savedProfile);
      setLatestTwin(builtTwin);
      setNotice("Profile saved and twin generated successfully.");
    },
    onError: (error) => {
      setNotice((error as Error).message);
    }
  });

  const simulationMutation = useMutation({
    mutationFn: async (values: SimulationFormValues) => {
      if (!profile) {
        throw new Error("Create your profile first.");
      }
      return runSimulation({
        profileId: profile.id,
        scenarios: [
          { id: "scenario-a", name: values.scenarioA, assumptions: [values.assumptionA] },
          { id: "scenario-b", name: values.scenarioB, assumptions: [values.assumptionB] }
        ]
      });
    },
    onSuccess: (simulation) => {
      setLatestSimulation(simulation);
      setNotice("Simulation completed. Review recommendation and tradeoffs.");
    },
    onError: (error) => {
      setNotice((error as Error).message);
    }
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!profile || !latestSimulation) {
        throw new Error("Run at least one simulation before generating a report.");
      }
      return generateReport({
        profileId: profile.id,
        simulationId: latestSimulation.id,
        title: `Career decision brief - ${new Date().toLocaleDateString()}`,
        audience: "mentor"
      });
    },
    onSuccess: () => {
      reportsQuery.refetch();
      setNotice("Report generated successfully.");
    },
    onError: (error) => {
      setNotice((error as Error).message);
    }
  });

  const dashboard = dashboardQuery.data;
  const reports = reportsQuery.data ?? [];
  const topActions = useMemo(() => dashboard?.nextActions ?? [], [dashboard]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-12">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
            Production MVP Build
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AuthControls />
          </div>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">CareerTwin AI</h1>
        <p className="max-w-3xl text-base text-slate-300 md:text-lg">
          Build your digital career twin and simulate your future with evidence-backed recommendations,
          confidence bands, and actionable next steps.
        </p>
      </header>

      <AnimatePresence>
        {notice ? (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {notice.toLowerCase().includes("error") ? <ErrorState label={notice} /> : <SuccessState label={notice} />}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!isSignedIn ? (
        <EmptyState label="Sign in or sign up to start building your Career Twin." />
      ) : (
        <Tabs.Root defaultValue="onboarding" className="space-y-4">
          <Tabs.List className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2" aria-label="Product sections">
            {[
              ["onboarding", "Onboarding"],
              ["simulation", "Simulation"],
              ["dashboard", "Dashboard"],
              ["reports", "Reports"]
            ].map(([value, label]) => (
              <Tabs.Trigger
                key={value}
                value={value}
                className="rounded-lg px-3 py-2 text-sm text-slate-300 data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
              >
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="onboarding" className="outline-none">
            <OnboardingForm
              onSubmit={async (values) => {
                await saveProfile.mutateAsync(values);
              }}
              isSubmitting={saveProfile.isPending}
            />
            {!profile ? <EmptyState label="No profile created yet. Complete the form above." /> : null}
            {latestTwin ? (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-lg font-semibold">Latest Twin Summary</h3>
                <p className="mt-2 text-sm text-slate-300">{latestTwin.summary}</p>
                <p className="mt-2 text-sm text-slate-400">
                  Confidence {latestTwin.confidence.min.toFixed(2)} - {latestTwin.confidence.max.toFixed(2)}
                </p>
              </div>
            ) : null}
          </Tabs.Content>

          <Tabs.Content value="simulation" className="space-y-4 outline-none">
            <SimulationForm
              disabled={!profile}
              onSubmit={async (values) => {
                await simulationMutation.mutateAsync(values);
              }}
            />
            {simulationMutation.isPending ? <LoadingState label="Running simulation with AI..." /> : null}
            {!latestSimulation ? <EmptyState label="No simulation run yet. Create at least one profile and run scenarios." /> : null}
            {latestSimulation ? (
              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <h3 className="text-lg font-semibold">Simulation Recommendation</h3>
                <p className="text-sm text-slate-200">{latestSimulation.recommendation}</p>
                <p className="text-sm text-slate-400">
                  Confidence {latestSimulation.confidenceBand.min.toFixed(2)} - {latestSimulation.confidenceBand.max.toFixed(2)}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <ul className="space-y-1 rounded-xl border border-slate-800 p-3 text-sm text-slate-300">
                    <li className="font-medium text-slate-100">Assumptions</li>
                    {latestSimulation.assumptions.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <ul className="space-y-1 rounded-xl border border-slate-800 p-3 text-sm text-slate-300">
                    <li className="font-medium text-slate-100">Trade-offs</li>
                    {latestSimulation.tradeoffs.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </Tabs.Content>

          <Tabs.Content value="dashboard" className="space-y-4 outline-none">
            {dashboardQuery.isLoading ? <LoadingState label="Loading dashboard insights..." /> : null}
            {dashboardQuery.isError ? <ErrorState label={(dashboardQuery.error as Error).message} /> : null}
            {!dashboard && !dashboardQuery.isLoading ? <EmptyState label="Dashboard will populate after onboarding and simulation." /> : null}
            {dashboard ? (
              <div className="grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="text-lg font-semibold">Decision Command Center</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    Latest role: {dashboard.profile.currentRole} | Goals: {dashboard.profile.goals.join(", ")}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">Reports generated: {dashboard.reportCount}</p>
                </article>
                <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <h3 className="text-lg font-semibold">Next Actions</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-300">
                    {topActions.map((action) => (
                      <li key={action}>• {action}</li>
                    ))}
                  </ul>
                </article>
              </div>
            ) : null}
          </Tabs.Content>

          <Tabs.Content value="reports" className="space-y-4 outline-none">
            <button
              type="button"
              onClick={() => reportMutation.mutate()}
              disabled={!profile || !latestSimulation || reportMutation.isPending}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reportMutation.isPending ? "Generating report..." : "Generate mentor report"}
            </button>
            {reportsQuery.isLoading ? <LoadingState label="Loading report history..." /> : null}
            {reportsQuery.isError ? <ErrorState label={(reportsQuery.error as Error).message} /> : null}
            {!reports.length && !reportsQuery.isLoading ? <EmptyState label="No reports yet. Generate your first report after a simulation." /> : null}
            {reports.length ? (
              <ul className="space-y-3">
                {reports.map((report: Report) => (
                  <li key={report.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm font-medium text-slate-100">{report.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{report.summary}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{report.audience} • {report.status}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </Tabs.Content>
        </Tabs.Root>
      )}
    </main>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";

const simulationSchema = z.object({
  scenarioA: z.string().min(2),
  assumptionA: z.string().min(2),
  scenarioB: z.string().min(2),
  assumptionB: z.string().min(2)
});

export type SimulationFormValues = z.infer<typeof simulationSchema>;

interface SimulationFormProps {
  disabled: boolean;
  onSubmit: (values: SimulationFormValues) => Promise<void>;
}

export function SimulationForm({ disabled, onSubmit }: SimulationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SimulationFormValues>({
    resolver: zodResolver(simulationSchema),
    defaultValues: {
      scenarioA: "Switch to AI platform engineering",
      assumptionA: "Can allocate 6 hours/week for upskilling",
      scenarioB: "Stay in current role for promotion path",
      assumptionB: "Promotion cycle in 9-12 months"
    }
  });

  return (
    <motion.form
      className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5"
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <h2 className="text-lg font-semibold">Simulation Engine</h2>
      <p className="text-sm text-slate-400">
        Compare at least two scenarios. Confidence and tradeoff analysis are generated for each run.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Scenario A" error={errors.scenarioA?.message}>
          <input {...register("scenarioA")} className={inputClass} />
        </Field>
        <Field label="Assumption A" error={errors.assumptionA?.message}>
          <input {...register("assumptionA")} className={inputClass} />
        </Field>
        <Field label="Scenario B" error={errors.scenarioB?.message}>
          <input {...register("scenarioB")} className={inputClass} />
        </Field>
        <Field label="Assumption B" error={errors.assumptionB?.message}>
          <input {...register("assumptionB")} className={inputClass} />
        </Field>
      </div>
      <button
        type="submit"
        disabled={disabled || isSubmitting}
        className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Running simulation..." : "Run simulation"}
      </button>
    </motion.form>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-300">{label}</span>
      {children}
      {error ? <span className="text-xs text-rose-300">{error}</span> : null}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400";

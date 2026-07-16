"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { type SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email."),
  currentRole: z.string().min(2, "Enter your current role."),
  yearsExperience: z.number().int().min(0).max(50),
  goals: z.string().min(4, "Add at least one clear goal."),
  locationPreference: z.string().min(2, "Add your location preference."),
  linkedinUrl: z.string().url("Enter a valid LinkedIn profile URL.")
});

export type OnboardingValues = z.infer<typeof schema>;

interface OnboardingFormProps {
  onSubmit: (values: OnboardingValues) => Promise<void>;
  isSubmitting: boolean;
}

export function OnboardingForm({ onSubmit, isSubmitting }: OnboardingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<OnboardingValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      currentRole: "",
      yearsExperience: 3,
      goals: "",
      locationPreference: "",
      linkedinUrl: ""
    }
  });

  const submitHandler: SubmitHandler<OnboardingValues> = async (values) => {
    await onSubmit(values);
  };

  return (
    <motion.form
      className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5"
      onSubmit={handleSubmit(submitHandler)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <h2 className="text-lg font-semibold">Create Career Twin</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Full name" error={errors.fullName?.message}>
          <input {...register("fullName")} className={inputClass} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input {...register("email")} type="email" className={inputClass} />
        </Field>
        <Field label="Current role" error={errors.currentRole?.message}>
          <input {...register("currentRole")} className={inputClass} />
        </Field>
        <Field label="Years of experience" error={errors.yearsExperience?.message}>
          <input {...register("yearsExperience", { valueAsNumber: true })} type="number" min={0} className={inputClass} />
        </Field>
      </div>
      <Field label="Career goals (comma separated)" error={errors.goals?.message}>
        <textarea {...register("goals")} rows={3} className={inputClass} />
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Location preference" error={errors.locationPreference?.message}>
          <input {...register("locationPreference")} className={inputClass} />
        </Field>
        <Field label="LinkedIn profile URL" error={errors.linkedinUrl?.message}>
          <input {...register("linkedinUrl")} className={inputClass} />
        </Field>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving profile..." : "Save profile and build twin"}
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

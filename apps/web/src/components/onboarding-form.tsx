"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Bot,
  Briefcase,
  Building2,
  Check,
  Clock,
  Code2,
  Compass,
  FolderGit2,
  GraduationCap,
  IndianRupee,
  Languages,
  Lightbulb,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Target,
  Trophy,
  User,
  Wallet
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, type SubmitHandler, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { LoadingState, SuccessState } from "@/components/state-blocks";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { SelectOrOther } from "@/components/ui/select-or-other";
import { TagInput } from "@/components/ui/tag-input";
import type { InterviewSession } from "@/types/domain";

const schema = z.object({
  label: z.string().max(100).optional().or(z.literal("")),
  profileType: z.enum(["student", "working_professional", "not_working"]),
  fullName: z.string().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().max(30).optional().or(z.literal("")),
  currentRole: z.string().min(2, "Enter your current role."),
  currentCompany: z.string().max(200).optional().or(z.literal("")),
  previousCompanies: z.array(z.string()),
  yearsExperience: z.number().int().min(0).max(50),
  locationPreference: z.string().min(2, "Add your location preference."),
  noticePeriodWeeks: z.number().int().min(0).max(52).optional(),
  goals: z.array(z.string()).min(1, "Add at least one goal."),
  preferredRoles: z.array(z.string()).min(1, "Add at least one target role."),
  dreamCompanies: z.array(z.string()),
  preferredCountries: z.array(z.string()),
  // .min(0) (not .positive()) — 0 is a valid answer for students and anyone not currently earning.
  expectedSalary: z.number().int().min(0).optional(),
  currentSalary: z.number().int().min(0).optional(),
  careerMotivation: z.string().min(8, "Tell us what motivates you."),
  workStyle: z.string().min(4, "Describe your preferred work style."),
  riskTolerance: z.enum(["low", "medium", "high"]),
  education: z.array(z.string()).min(1, "Add at least one education highlight."),
  technicalSkills: z.array(z.string()).min(1, "Add key technical skills."),
  softSkills: z.array(z.string()).min(1, "Add key soft skills."),
  languages: z.array(z.string()),
  certifications: z.array(z.string()),
  achievements: z.array(z.string()),
  projects: z.array(z.string()),
  portfolioUrl: z.string().url("Enter valid URL").optional().or(z.literal("")),
  githubUrl: z.string().url("Enter valid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Enter a valid LinkedIn profile URL.").optional().or(z.literal("")),
  interviewQ1: z.string().min(4, "Please answer this question."),
  interviewQ2: z.string().min(4, "Please answer this question."),
  interviewQ3: z.string().min(4, "Please answer this question."),
  interviewQ4: z.string().min(4, "Please answer this question."),
  interviewQ5: z.string().min(4, "Please answer this question.")
});

export type OnboardingValues = z.infer<typeof schema>;

interface OnboardingFormProps {
  // Final action, triggered from the last (AI Interview) step — builds the Career Twin from the
  // profile already persisted via onEnterInterviewStep.
  onSubmit: (values: OnboardingValues) => Promise<void>;
  isSubmitting: boolean;
  // Only fills fields the user hasn't already typed into — used when enriching from an imported resume.
  draftSeed?: { values: Partial<OnboardingValues>; version: number } | null;
  // Always applies its values — used to restore a previously saved profile on load, since that's
  // the definitive persisted state and the form is otherwise still blank at that point.
  profileSeed?: { values: Partial<OnboardingValues>; version: number } | null;
  // Namespaces the local autosave draft so in-progress (unsaved) edits survive a refresh without
  // leaking between users or between profiles (each profile — and "new profile" — gets its own draft).
  draftNamespace?: string | null;
  // Called when advancing from Reflection into AI Interview — silently creates/updates the profile
  // so the live interview session has a real profile id to talk to, ahead of the final build.
  onEnterInterviewStep: (values: OnboardingValues) => Promise<void>;
  isSavingProfile: boolean;
  interviewSession?: InterviewSession | null;
  isInterviewLoading?: boolean;
  interviewAnswer: string;
  onInterviewAnswerChange: (value: string) => void;
  onSubmitInterviewAnswer: () => void;
  isSubmittingInterviewAnswer?: boolean;
}

function getDraftStorageKey(draftNamespace?: string | null): string | null {
  return draftNamespace ? `careertwin:onboarding-draft:${draftNamespace}` : null;
}

const ARRAY_FIELDS = [
  "goals",
  "preferredRoles",
  "dreamCompanies",
  "preferredCountries",
  "previousCompanies",
  "education",
  "technicalSkills",
  "softSkills",
  "languages",
  "certifications",
  "achievements",
  "projects"
] as const satisfies ReadonlyArray<keyof OnboardingValues>;

function mergeUnique(existing: string[], incoming: string[]): string[] {
  return [...new Set([...existing, ...incoming])];
}

// Salary is captured as a bucketed range (INR, Lakhs Per Annum) rather than free-typed to avoid
// ambiguous currency entry and keep values comparable across profiles. The stored number is the
// upper bound of the selected range (0 means "not currently earning").
const SALARY_RANGE_OPTIONS = [
  { value: 0, label: "0 LPA — Not currently earning" },
  { value: 3, label: "Up to 3 LPA" },
  { value: 6, label: "3 – 6 LPA" },
  { value: 10, label: "6 – 10 LPA" },
  { value: 15, label: "10 – 15 LPA" },
  { value: 20, label: "15 – 20 LPA" },
  { value: 25, label: "20 – 25 LPA" },
  { value: 35, label: "25 – 35 LPA" },
  { value: 50, label: "35 – 50 LPA" },
  { value: 75, label: "50 – 75 LPA" },
  { value: 100, label: "75 LPA – 1 Cr" },
  { value: 150, label: "1 Cr+" }
];

const LOCATION_PREFERENCE_OPTIONS = [
  { value: "Remote", label: "Remote (anywhere)" },
  { value: "Bengaluru", label: "Bengaluru" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Pune", label: "Pune" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Delhi NCR", label: "Delhi NCR" },
  { value: "Chennai", label: "Chennai" },
  { value: "Kolkata", label: "Kolkata" },
  { value: "Open to relocate (India)", label: "Open to relocate (India)" },
  { value: "Open to relocate (International)", label: "Open to relocate (International)" }
];

const WORK_STYLE_OPTIONS = [
  { value: "Remote-first, high autonomy", label: "Remote-first, high autonomy" },
  { value: "Hybrid, balanced structure", label: "Hybrid, balanced structure" },
  { value: "In-office, collaborative", label: "In-office, collaborative" },
  { value: "Fast-paced startup environment", label: "Fast-paced startup environment" },
  { value: "Structured, process-driven", label: "Structured, process-driven" },
  { value: "Async-first, flexible hours", label: "Async-first, flexible hours" }
];

const COMMON_COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "Australia",
  "Singapore",
  "United Arab Emirates",
  "Netherlands",
  "France"
];

const PROFILE_TYPE_OPTIONS = [
  { value: "student" as const, label: "Student", icon: <GraduationCap className="size-3.5" /> },
  { value: "working_professional" as const, label: "Working professional", icon: <Briefcase className="size-3.5" /> },
  { value: "not_working" as const, label: "Not currently working", icon: <Compass className="size-3.5" /> }
];

// Each profile type gets its own reflection set: working professionals are framed around their
// current job, students around academics/projects (no job history to draw on yet), and people
// not currently working (career break, laid off, between jobs — but who HAVE worked before)
// around their most recent role and re-entry motivation, not a job they don't currently have.
const PROFESSIONAL_REFLECTION_QUESTIONS = [
  { name: "interviewQ1" as const, question: "Why are you exploring a career change or new opportunity right now?" },
  { name: "interviewQ2" as const, question: "What kind of work excites you most?" },
  { name: "interviewQ3" as const, question: "What are your strongest accomplishments and why?" },
  { name: "interviewQ4" as const, question: "What kind of culture do you avoid?" },
  { name: "interviewQ5" as const, question: "Where do you want to be in 3 years?" }
];

const STUDENT_REFLECTION_QUESTIONS = [
  { name: "interviewQ1" as const, question: "Why are you excited about this career path?" },
  { name: "interviewQ2" as const, question: "What subjects, courses, or projects do you enjoy the most?" },
  { name: "interviewQ3" as const, question: "What academic project, internship, or personal project are you most proud of?" },
  { name: "interviewQ4" as const, question: "What kind of team or company culture would help you thrive?" },
  { name: "interviewQ5" as const, question: "Where do you want to be professionally in 3 years?" }
];

const NOT_WORKING_REFLECTION_QUESTIONS = [
  { name: "interviewQ1" as const, question: "What's motivating you to get back into work right now?" },
  { name: "interviewQ2" as const, question: "What's the most recent role or project you're proud of, and what was your direct impact?" },
  { name: "interviewQ3" as const, question: "What leadership moments from your career shaped your confidence?" },
  { name: "interviewQ4" as const, question: "What kind of company culture do you want to avoid this time around?" },
  { name: "interviewQ5" as const, question: "Where do you want to be professionally in 3 years?" }
];

const STEP_META = [
  { title: "You", icon: <User className="size-4" /> },
  { title: "Direction", icon: <Target className="size-4" /> },
  { title: "Evidence", icon: <Sparkles className="size-4" /> },
  { title: "Reflection", icon: <Lightbulb className="size-4" /> },
  { title: "AI Interview", icon: <Bot className="size-4" /> }
];

// Reflection is the last step backed by form fields — advancing past it is when we hand off to
// the live AI interview, which needs a saved profile id to talk to.
const REFLECTION_STEP_INDEX = 3;

export function OnboardingForm({
  onSubmit,
  isSubmitting,
  draftSeed,
  profileSeed,
  draftNamespace,
  onEnterInterviewStep,
  isSavingProfile,
  interviewSession,
  isInterviewLoading,
  interviewAnswer,
  onInterviewAnswerChange,
  onSubmitInterviewAnswer,
  isSubmittingInterviewAnswer
}: OnboardingFormProps) {
  const [step, setStep] = useState(0);
  const hasLoadedDraftRef = useRef(false);
  const storageKey = getDraftStorageKey(draftNamespace);
  const {
    register,
    handleSubmit,
    control,
    trigger,
    getValues,
    setValue,
    formState: { errors }
  } = useForm<OnboardingValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: "",
      profileType: "working_professional",
      fullName: "",
      email: "",
      phone: "",
      currentRole: "",
      currentCompany: "",
      previousCompanies: [],
      yearsExperience: 3,
      locationPreference: "",
      noticePeriodWeeks: undefined,
      goals: [],
      preferredRoles: [],
      dreamCompanies: [],
      preferredCountries: [],
      expectedSalary: undefined,
      currentSalary: undefined,
      careerMotivation: "",
      workStyle: "",
      riskTolerance: "medium",
      education: [],
      technicalSkills: [],
      softSkills: [],
      languages: [],
      certifications: [],
      achievements: [],
      projects: [],
      portfolioUrl: "",
      githubUrl: "",
      linkedinUrl: "",
      interviewQ1: "",
      interviewQ2: "",
      interviewQ3: "",
      interviewQ4: "",
      interviewQ5: ""
    }
  });

  const submitHandler: SubmitHandler<OnboardingValues> = async (values) => {
    await onSubmit(values);
    if (storageKey) window.localStorage.removeItem(storageKey);
  };

  // Restore any in-progress (never-submitted) edits once on mount, before the profile/resume
  // draftSeed effects below can run — those take priority once a real saved profile exists.
  useEffect(() => {
    if (!storageKey || hasLoadedDraftRef.current) return;
    hasLoadedDraftRef.current = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<OnboardingValues>;
      Object.entries(saved).forEach(([key, value]) => {
        if (value === undefined || value === "") return;
        if (Array.isArray(value) && value.length === 0) return;
        setValue(key as keyof OnboardingValues, value as never, { shouldDirty: true });
      });
    } catch {
      // Corrupt or unavailable local storage (e.g. private browsing) — form just starts blank.
    }
  }, [storageKey, setValue]);

  const liveValues = useWatch({ control });
  // Drives copy/placeholder changes across the form so students, working professionals, and
  // people currently not working each see language relevant to their situation.
  const profileType = liveValues?.profileType ?? "working_professional";
  const isStudent = profileType === "student";
  const isNotWorking = profileType === "not_working";
  // Notice period only makes sense for someone currently employed elsewhere.
  const isCurrentlyEmployed = profileType === "working_professional";

  // Notice period is only relevant while currently employed — clear stale values if the user
  // switches away from "working professional" after having filled it in.
  useEffect(() => {
    if (!isCurrentlyEmployed && getValues("noticePeriodWeeks") !== undefined) {
      setValue("noticePeriodWeeks", undefined, { shouldDirty: true });
    }
  }, [isCurrentlyEmployed, getValues, setValue]);

  useEffect(() => {
    if (!storageKey) return;
    const timeoutId = setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(liveValues));
      } catch {
        // Storage may be full or unavailable — the draft simply won't persist this time.
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [storageKey, liveValues]);

  const steps = useMemo(
    () => [
      {
        fields: [
          "label",
          "profileType",
          "fullName",
          "email",
          "phone",
          "currentRole",
          "currentCompany",
          "previousCompanies",
          "yearsExperience",
          "locationPreference",
          "noticePeriodWeeks"
        ] as const
      },
      {
        fields: [
          "goals",
          "preferredRoles",
          "dreamCompanies",
          "preferredCountries",
          "careerMotivation",
          "workStyle",
          "riskTolerance",
          "expectedSalary",
          "currentSalary"
        ] as const
      },
      {
        fields: [
          "education",
          "technicalSkills",
          "softSkills",
          "languages",
          "certifications",
          "achievements",
          "projects",
          "linkedinUrl",
          "githubUrl",
          "portfolioUrl"
        ] as const
      },
      { fields: ["interviewQ1", "interviewQ2", "interviewQ3", "interviewQ4", "interviewQ5"] as const },
      // AI Interview step has no form-managed fields — the live session lives in query/mutation state.
      { fields: [] as const }
    ],
    []
  );

  useEffect(() => {
    if (!draftSeed) return;
    Object.entries(draftSeed.values).forEach(([key, value]) => {
      const field = key as keyof OnboardingValues;
      if (value === undefined) return;
      if ((ARRAY_FIELDS as readonly string[]).includes(field) && Array.isArray(value)) {
        setValue(field, mergeUnique(getValues(field) as string[], value as string[]) as never, { shouldDirty: true });
        return;
      }
      const current = getValues(field);
      if (!current) {
        setValue(field, value as never, { shouldDirty: true });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftSeed?.version]);

  // Restores a previously saved profile in full — unlike draftSeed above, this always applies
  // since it reflects the definitive persisted state at load time (the form is otherwise blank).
  useEffect(() => {
    if (!profileSeed) return;
    Object.entries(profileSeed.values).forEach(([key, value]) => {
      const field = key as keyof OnboardingValues;
      if (value === undefined) return;
      setValue(field, value as never, { shouldDirty: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileSeed?.version]);

  async function goNextStep() {
    const isValid = await trigger(steps[step].fields as unknown as Array<keyof OnboardingValues>);
    if (!isValid) return;
    if (step === REFLECTION_STEP_INDEX) {
      try {
        await onEnterInterviewStep(getValues());
      } catch {
        return; // Parent already surfaced the failure via toast — stay on this step to retry.
      }
    }
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  }

  return (
    <motion.form
      onSubmit={handleSubmit(submitHandler)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-white">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Twin Genesis</h2>
            <p className="text-xs text-[var(--muted)]">Every answer sharpens your Career Twin in real time.</p>
          </div>
        </div>
        <ProgressSteps steps={STEP_META} activeIndex={step} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {step === 0 ? (
            <div className="space-y-4">
              <Field
                label="I am currently a..."
                icon={<Compass className="size-3.5" />}
                hint="This shapes the questions we ask you next, so your Career Twin fits your actual situation."
              >
                <Controller
                  control={control}
                  name="profileType"
                  render={({ field }) => (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {PROFILE_TYPE_OPTIONS.map((option) => {
                        // Selected uses a solid fill (not just a soft tint) so it can never be mistaken
                        // for the lighter, border-only hover state on the other, unselected options.
                        const active = field.value === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                              active
                                ? "border-transparent bg-[image:var(--gradient-primary)] text-white shadow-[var(--shadow-soft)]"
                                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
                            }`}
                          >
                            {active ? <Check className="size-3.5" /> : option.icon}
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Profile name"
                  icon={<Sparkles className="size-3.5" />}
                  hint="Name this career profile so you can tell it apart from others you create (e.g. \u201cStaff Engineer track\u201d)."
                  error={errors.label?.message}
                  className="md:col-span-2"
                >
                  <input {...register("label")} className={inputClass} placeholder="e.g. Software Engineer track" />
                </Field>
                <Field label="Full name" icon={<User className="size-3.5" />} error={errors.fullName?.message}>
                  <input {...register("fullName")} className={inputClass} placeholder="Ada Lovelace" />
                </Field>
                <Field label="Email" icon={<Mail className="size-3.5" />} error={errors.email?.message}>
                  <input {...register("email")} type="email" className={inputClass} placeholder="you@domain.com" />
                </Field>
                <Field
                  label={isStudent ? "Field of study / target role" : isNotWorking ? "Most recent role" : "Current role"}
                  icon={<Briefcase className="size-3.5" />}
                  error={errors.currentRole?.message}
                >
                  <input
                    {...register("currentRole")}
                    className={inputClass}
                    placeholder={
                      isStudent
                        ? "Computer Science student, aspiring SDE"
                        : isNotWorking
                          ? "Senior Software Engineer (last role held)"
                          : "Senior Software Engineer"
                    }
                  />
                </Field>
                <Field label="Phone" icon={<Phone className="size-3.5" />} error={errors.phone?.message}>
                  <input {...register("phone")} className={inputClass} placeholder="+1 555 123 4567" />
                </Field>
                <Field
                  label={isStudent ? "College / university" : isNotWorking ? "Most recent company" : "Current company"}
                  icon={<Building2 className="size-3.5" />}
                  error={errors.currentCompany?.message}
                >
                  <input {...register("currentCompany")} className={inputClass} placeholder={isStudent ? "IIT Delhi" : "Acme Corp"} />
                </Field>
                <Field
                  label="Years of experience"
                  icon={<Clock className="size-3.5" />}
                  hint={
                    isStudent
                      ? "0 is perfectly fine if you're still studying."
                      : isNotWorking
                        ? "Total experience from before your break."
                        : undefined
                  }
                  error={errors.yearsExperience?.message}
                >
                  <input {...register("yearsExperience", { valueAsNumber: true })} type="number" min={0} className={inputClass} />
                </Field>
                <Field label="Location preference" icon={<MapPin className="size-3.5" />} error={errors.locationPreference?.message}>
                  <Controller
                    control={control}
                    name="locationPreference"
                    render={({ field }) => (
                      <SelectOrOther value={field.value} onChange={field.onChange} options={LOCATION_PREFERENCE_OPTIONS} />
                    )}
                  />
                </Field>
                {isCurrentlyEmployed ? (
                  <Field label="Notice period (weeks)" icon={<Clock className="size-3.5" />} error={errors.noticePeriodWeeks?.message}>
                    <input {...register("noticePeriodWeeks", { valueAsNumber: true })} type="number" min={0} className={inputClass} />
                  </Field>
                ) : null}
                <Field
                  label={isStudent ? "Internships" : "Previous companies"}
                  icon={<Briefcase className="size-3.5" />}
                  className="md:col-span-2"
                >
                  <Controller
                    control={control}
                    name="previousCompanies"
                    render={({ field }) => (
                      <TagInput
                        value={field.value}
                        onChange={field.onChange}
                        accent="accent-2"
                        placeholder={isStudent ? "Summer internship at..." : "Google, Stripe..."}
                      />
                    )}
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <Field label="Career goals" icon={<Target className="size-3.5" />} error={errors.goals?.message} hint="Press Enter or comma to add">
                <Controller
                  control={control}
                  name="goals"
                  render={({ field }) => (
                    <TagInput value={field.value} onChange={field.onChange} placeholder="Become a staff engineer..." />
                  )}
                />
              </Field>
              <Field label="Preferred roles" icon={<Briefcase className="size-3.5" />} error={errors.preferredRoles?.message}>
                <Controller
                  control={control}
                  name="preferredRoles"
                  render={({ field }) => (
                    <TagInput value={field.value} onChange={field.onChange} accent="accent-2" placeholder="Staff Engineer, AI PM..." />
                  )}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Dream companies" icon={<Building2 className="size-3.5" />}>
                  <Controller
                    control={control}
                    name="dreamCompanies"
                    render={({ field }) => (
                      <TagInput value={field.value} onChange={field.onChange} accent="accent-3" placeholder="OpenAI, Stripe..." />
                    )}
                  />
                </Field>
                <Field label="Preferred countries" icon={<MapPin className="size-3.5" />} hint="Tap to add, or type your own below.">
                  <Controller
                    control={control}
                    name="preferredCountries"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {COMMON_COUNTRIES.map((country) => {
                            const active = field.value.includes(country);
                            return (
                              <button
                                key={country}
                                type="button"
                                onClick={() =>
                                  field.onChange(
                                    active ? field.value.filter((item) => item !== country) : mergeUnique(field.value, [country])
                                  )
                                }
                                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                                  active
                                    ? "bg-[var(--accent-2-soft)] text-[var(--accent-2)]"
                                    : "border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent-2)]/40 hover:text-[var(--foreground)]"
                                }`}
                              >
                                {country}
                              </button>
                            );
                          })}
                        </div>
                        <TagInput value={field.value} onChange={field.onChange} accent="accent-2" placeholder="Other country..." />
                      </div>
                    )}
                  />
                </Field>
                <Field
                  label={isStudent ? "Expected starting salary (LPA, INR)" : "Expected salary (LPA, INR)"}
                  icon={<Wallet className="size-3.5" />}
                >
                  <select
                    {...register("expectedSalary", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Select a range
                    </option>
                    {SALARY_RANGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Current salary (LPA, INR)"
                  icon={<IndianRupee className="size-3.5" />}
                  hint={isStudent || isNotWorking ? "Pick \"Not currently earning\" if that applies to you." : undefined}
                >
                  <select
                    {...register("currentSalary", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Select a range
                    </option>
                    {SALARY_RANGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Career motivation" icon={<Sparkles className="size-3.5" />} error={errors.careerMotivation?.message}>
                <textarea
                  {...register("careerMotivation")}
                  rows={2}
                  className={inputClass}
                  placeholder={
                    isStudent
                      ? "What draws you to this career path?"
                      : isNotWorking
                        ? "What's motivating your next move?"
                        : "What drives you forward?"
                  }
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Preferred work style" icon={<Briefcase className="size-3.5" />} error={errors.workStyle?.message}>
                  <Controller
                    control={control}
                    name="workStyle"
                    render={({ field }) => (
                      <SelectOrOther value={field.value} onChange={field.onChange} options={WORK_STYLE_OPTIONS} />
                    )}
                  />
                </Field>
                <Field label="Risk tolerance" icon={<Target className="size-3.5" />}>
                  <select {...register("riskTolerance")} className={inputClass}>
                    <option value="low">Low - I prefer stability</option>
                    <option value="medium">Medium - Balanced approach</option>
                    <option value="high">High - I chase upside</option>
                  </select>
                </Field>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <Field label="Education" icon={<GraduationCap className="size-3.5" />} error={errors.education?.message}>
                <Controller
                  control={control}
                  name="education"
                  render={({ field }) => <TagInput value={field.value} onChange={field.onChange} placeholder="B.Tech CS, Stanford..." />}
                />
              </Field>
              <Field label="Technical skills" icon={<Code2 className="size-3.5" />} error={errors.technicalSkills?.message}>
                <Controller
                  control={control}
                  name="technicalSkills"
                  render={({ field }) => (
                    <TagInput value={field.value} onChange={field.onChange} accent="accent-2" placeholder="TypeScript, System Design..." />
                  )}
                />
              </Field>
              <Field label="Soft skills" icon={<MessageCircle className="size-3.5" />} error={errors.softSkills?.message}>
                <Controller
                  control={control}
                  name="softSkills"
                  render={({ field }) => (
                    <TagInput value={field.value} onChange={field.onChange} accent="accent-3" placeholder="Communication, Mentorship..." />
                  )}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Languages" icon={<Languages className="size-3.5" />}>
                  <Controller control={control} name="languages" render={({ field }) => <TagInput value={field.value} onChange={field.onChange} placeholder="English, Hindi..." />} />
                </Field>
                <Field label="Certifications" icon={<Award className="size-3.5" />}>
                  <Controller control={control} name="certifications" render={({ field }) => <TagInput value={field.value} onChange={field.onChange} accent="accent-2" placeholder="AWS, PMP..." />} />
                </Field>
                <Field label="Achievements" icon={<Trophy className="size-3.5" />}>
                  <Controller control={control} name="achievements" render={({ field }) => <TagInput value={field.value} onChange={field.onChange} accent="accent-3" placeholder="Led migration, Won hackathon..." />} />
                </Field>
                <Field label="Projects" icon={<Sparkles className="size-3.5" />}>
                  <Controller control={control} name="projects" render={({ field }) => <TagInput value={field.value} onChange={field.onChange} placeholder="CareerTwin AI, Side project..." />} />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="LinkedIn URL" icon={<Link2 className="size-3.5" />} error={errors.linkedinUrl?.message}>
                  <input {...register("linkedinUrl")} className={inputClass} placeholder="https://linkedin.com/in/..." />
                </Field>
                <Field label="GitHub URL" icon={<FolderGit2 className="size-3.5" />} error={errors.githubUrl?.message}>
                  <input {...register("githubUrl")} className={inputClass} placeholder="https://github.com/..." />
                </Field>
                <Field label="Portfolio URL" icon={<Link2 className="size-3.5" />} error={errors.portfolioUrl?.message}>
                  <input {...register("portfolioUrl")} className={inputClass} placeholder="https://yoursite.com" />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted)]">
                A few reflection questions to establish your Twin&apos;s voice — right after this, a live AI interviewer will
                ask deeper follow-ups before your Career Twin is built.
              </p>
              {(isStudent
                ? STUDENT_REFLECTION_QUESTIONS
                : isNotWorking
                  ? NOT_WORKING_REFLECTION_QUESTIONS
                  : PROFESSIONAL_REFLECTION_QUESTIONS
              ).map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5"
                >
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                    <MessageCircle className="size-3.5 text-[var(--accent)]" />
                    {item.question}
                  </p>
                  <textarea {...register(item.name)} rows={3} className={inputClass} />
                  {errors[item.name] ? (
                    <p className="mt-1 text-xs text-[var(--danger)]">{errors[item.name]?.message}</p>
                  ) : null}
                </motion.div>
              ))}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
                <Bot className="size-4 shrink-0 text-[var(--accent)]" />
                <p className="text-sm text-[var(--foreground)]">
                  Your AI interviewer keeps asking adaptive follow-ups until your Career Twin has enough signal. Answer a
                  few, then build your twin whenever you&apos;re ready.
                </p>
              </div>
              {isInterviewLoading ? <LoadingState label="Loading your interviewer..." /> : null}
              {interviewSession ? (
                <div className="space-y-3">
                  {interviewSession.answered.length ? (
                    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] p-3.5">
                      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Previous answers</p>
                      <ul className="mt-2 space-y-2 text-xs text-[var(--foreground)]">
                        {interviewSession.answered.map((item, index) => (
                          <li key={`${item.question}-${index}`}>
                            <p className="font-medium text-[var(--accent)]">Q: {item.question}</p>
                            <p className="text-[var(--muted)]">A: {item.answer}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {interviewSession.isComplete ? (
                    <SuccessState label="Interview complete. Your Career Twin now has deeper context for simulations — build it below." />
                  ) : (
                    <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
                      <p className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                        <Bot className="size-3.5 text-[var(--accent)]" />
                        {interviewSession.nextQuestion}
                      </p>
                      <textarea
                        value={interviewAnswer}
                        onChange={(event) => onInterviewAnswerChange(event.target.value)}
                        rows={4}
                        className={inputClass}
                        placeholder="Answer with specifics, examples, and constraints..."
                      />
                      <Button
                        type="button"
                        variant="primary"
                        onClick={onSubmitInterviewAnswer}
                        disabled={isSubmittingInterviewAnswer || !interviewAnswer.trim()}
                      >
                        {isSubmittingInterviewAnswer ? "Saving answer..." : "Submit answer"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between border-t border-[var(--border-soft)] pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
          disabled={step === 0 || isSubmitting || isSavingProfile}
        >
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button type="button" onClick={goNextStep} disabled={isSavingProfile}>
            {isSavingProfile ? "Saving your progress..." : "Continue"}
          </Button>
        ) : (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Synthesizing Career Twin..." : "Build my Career Twin"}
          </Button>
        )}
      </div>
    </motion.form>
  );
}

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">{label}</div>;
}

export function ErrorState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-200">
      <AlertTriangle className="size-4" />
      {label}
    </div>
  );
}

export function SuccessState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-sm text-emerald-200">
      <CheckCircle2 className="size-4" />
      {label}
    </div>
  );
}

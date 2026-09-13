import { cn } from "@/lib/utils";
import type { FeatureStatus } from "@/lib/content";

const statusMap: Record<FeatureStatus, { label: string; className: string }> = {
  complete: { label: "REAL", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  "in-progress": { label: "IN PROGRESS", className: "bg-seai-100 text-seai-700 dark:bg-seai-900/40 dark:text-seai-300" },
  partial: { label: "PARTIAL", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  experimental: { label: "EXPERIMENTAL", className: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  future: { label: "FUTURE", className: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400" },
};

export function StatusPill({ status, className }: { status: FeatureStatus; className?: string }) {
  const s = statusMap[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  );
}
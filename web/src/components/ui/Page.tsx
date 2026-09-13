import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/ui/StatusPill";
import type { FeatureStatus } from "@/lib/content";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  lede?: string;
  status?: FeatureStatus;
  snapshot?: boolean;
}

export function PageHeader({ eyebrow, title, lede, status, snapshot }: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
      <div className="absolute inset-0 bg-gradient-to-br from-seai-50/60 via-white to-darwin-50/40 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
      <div className="container-wide relative py-16 lg:py-24">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-seai-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-seai-700 dark:bg-seai-900/50 dark:text-seai-300">
              {eyebrow}
            </p>
          )}
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">{title}</h1>
            {status && <StatusPill status={status} className="hidden sm:inline-flex" />}
          </div>
          {lede && <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">{lede}</p>}
          {snapshot && (
            <p className="mt-6 inline-flex items-center gap-2 rounded-lg border border-seai-200 bg-seai-50 px-3 py-1.5 text-xs font-semibold text-seai-700 dark:border-seai-800 dark:bg-seai-900/30 dark:text-seai-300">
              <span className="h-2 w-2 rounded-full bg-seai-500" aria-hidden="true" />
              CURRENT VERIFIED SNAPSHOT — NOT LIVE TELEMETRY
            </p>
          )}
        </div>
      </div>
    </header>
  );
}

interface CardLinkProps {
  href: string;
  title: string;
  description?: string;
  status?: FeatureStatus;
  external?: boolean;
}

export function CardLink({ href, title, description, status, external }: CardLinkProps) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 transition-all",
        "dark:border-slate-800 dark:bg-slate-900",
        "hover:-translate-y-0.5 hover:border-seai-300 hover:shadow-lg dark:hover:border-seai-700",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {status && <StatusPill status={status} />}
          <ExternalLink
            className={cn("h-4 w-4 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-seai-500", !external && "hidden")}
            aria-hidden="true"
          />
        </div>
      </div>
      {description && <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>}
    </Link>
  );
}
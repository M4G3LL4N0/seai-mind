"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "darwin"
  | "outline";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { className, variant = "default", size = "md", children, ...props },
    ref,
  ) => {
    const variants = {
      default:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      primary:
        "bg-seai-100 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300",
      success:
        "bg-seai-100 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300",
      warning:
        "bg-seai-100 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300",
      destructive:
        "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
      info: "bg-seai-100 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300",
      darwin:
        "bg-seai-100 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300",
      outline:
        "bg-transparent border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-xs",
      lg: "px-3 py-1.5 text-sm",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-full",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

export const StatusBadge = ({
  status,
  size = "md",
}: {
  status:
    | "active"
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "paused"
    | "error"
    | "complete"
    | "in-progress"
    | "planned";
  size?: "sm" | "md" | "lg";
}) => {
  const statusConfig = {
    active: { variant: "success" as const, label: "Active" },
    pending: { variant: "warning" as const, label: "Pending" },
    running: { variant: "info" as const, label: "Running" },
    completed: { variant: "success" as const, label: "Completed" },
    failed: { variant: "destructive" as const, label: "Failed" },
    paused: { variant: "default" as const, label: "Paused" },
    error: { variant: "destructive" as const, label: "Error" },
    complete: { variant: "success" as const, label: "Complete" },
    "in-progress": { variant: "info" as const, label: "In Progress" },
    planned: { variant: "default" as const, label: "Planned" },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
};

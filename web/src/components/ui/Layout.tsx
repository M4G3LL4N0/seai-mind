"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-slate-200 dark:bg-slate-700",
        orientation === "horizontal" ? "w-full h-px" : "h-full w-px",
        className,
      )}
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      {...props}
    />
  ),
);

Separator.displayName = "Separator";

export const Section = ({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "default" | "lg" | "xl";
}) => {
  const sizes = {
    sm: "py-12",
    default: "py-20",
    lg: "py-28",
    xl: "py-36",
  };

  return (
    <section className={cn(sizes[size], className)}>{children}</section>
  );
};

export const Container = ({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "narrow" | "default" | "wide" | "full";
}) => {
  const sizes = {
    narrow: "max-w-3xl",
    default: "max-w-5xl",
    wide: "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", sizes[size], className)}>
      {children}
    </div>
  );
};
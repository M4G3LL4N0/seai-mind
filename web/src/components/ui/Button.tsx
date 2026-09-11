"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, children, asChild, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-seai-600 text-white hover:bg-seai-700 focus-visible:ring-seai-500 active:bg-seai-800",
      secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:active:bg-slate-600",
      outline:
        "border border-slate-300 bg-transparent hover:bg-slate-100 focus-visible:ring-slate-400 active:bg-slate-200 dark:border-slate-600 dark:hover:bg-slate-800 dark:active:bg-slate-700",
      ghost:
        "bg-transparent hover:bg-slate-100 focus-visible:ring-slate-400 active:bg-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 active:bg-red-800",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2",
      xl: "px-8 py-4 text-lg gap-3",
    };

    const Comp = asChild ? "span" : "button";
    const buttonProps = asChild ? { ...props } : { ...props, disabled };

    return (
      <Comp
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...buttonProps}
      >
        {children}
      </Comp>
    );
  },
);

Button.displayName = "Button";

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

export const LinkButton = ({
  href,
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: LinkButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const variants = {
    primary:
      "bg-seai-600 text-white hover:bg-seai-700 focus-visible:ring-seai-500 active:bg-seai-800",
    secondary:
      "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:active:bg-slate-600",
    outline:
      "border border-slate-300 bg-transparent hover:bg-slate-100 focus-visible:ring-slate-400 active:bg-slate-200 dark:border-slate-600 dark:hover:bg-slate-800 dark:active:bg-slate-700",
    ghost:
      "bg-transparent hover:bg-slate-100 focus-visible:ring-slate-400 active:bg-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700",
    destructive:
      "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 active:bg-red-800",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
    xl: "px-8 py-4 text-lg gap-3",
  };

  return (
    <a
      href={href}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </a>
  );
};
"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  Brain,
  GitBranch,
  Terminal,
  Code,
  Settings,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Brain },
  { href: "/darwin", label: "Darwin 0.1", icon: FlaskConical },
  { href: "/command", label: "Command Center", icon: LayoutDashboard },
  { href: "/architecture", label: "Architecture", icon: GitBranch },
  { href: "/research", label: "Research", icon: FlaskConical },
  { href: "/benchmarks", label: "Benchmarks", icon: Terminal },
  { href: "/minds", label: "Minds", icon: Brain },
  { href: "/docs", label: "Docs", icon: BookOpen },
  { href: "/releases", label: "Releases", icon: Code },
];

const navGroups = [
  {
    label: "Platform",
    items: [
      { href: "/command", label: "Command Center", icon: LayoutDashboard, description: "Control your Minds" },
      { href: "/minds", label: "Mind Gallery", icon: Brain, description: "Browse reference Minds" },
      { href: "/benchmarks", label: "Benchmarks", icon: Terminal, description: "Compare performance" },
    ],
  },
  {
    label: "Learn",
    items: [
      { href: "/architecture", label: "Architecture", icon: GitBranch, description: "System design" },
      { href: "/research", label: "Research", icon: FlaskConical, description: "Papers & experiments" },
      { href: "/docs", label: "Documentation", icon: BookOpen, description: "Guides & API reference" },
    ],
  },
  {
    label: "Releases",
    items: [
      { href: "/darwin", label: "Darwin 0.1", icon: FlaskConical, description: "Current generation" },
      { href: "/releases", label: "All Releases", icon: Code, description: "Version history" },
      { href: "/releases#codenames", label: "Codename Registry", icon: GitBranch, description: "Future generations" },
    ],
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
      <nav className="container-wide" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="SE-AI Mind Home">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              SE-AI
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium bg-darwin-100 text-darwin-700 dark:bg-darwin-900/50 dark:text-darwin-300 rounded-full">
              Darwin 0.1
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-seai-50 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800",
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="https://github.com/seai-mind"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </Link>
            <Button variant="primary" size="sm" asChild>
              <Link href="/command">Open Command Center</Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 animate-slide-down">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-seai-50 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800",
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
              <hr className="my-3 border-slate-200 dark:border-slate-700" />
              <Link
                href="https://github.com/seai-mind"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </Link>
              <Button variant="primary" className="mt-2" asChild>
                <Link href="/command" onClick={() => setMobileOpen(false)}>Open Command Center</Link>
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
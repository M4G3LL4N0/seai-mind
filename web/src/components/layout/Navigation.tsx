"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, Github, ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { primaryNav, moreNav, site } from "@/lib/content";

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
      <nav className="container-wide" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="SE-AI Home">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SE-AI</span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium bg-darwin-100 text-darwin-700 dark:bg-darwin-900/50 dark:text-darwin-300 rounded-full">
              Darwin 0.1
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(pathname, item.href)
                    ? "bg-seai-50 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ))}

            <div className="relative" ref={moreRef}>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(pathname, "/what-is-seai") ||
                    isActive(pathname, "/architecture") ||
                    isActive(pathname, "/minds/paios") ||
                    isActive(pathname, "/roadmap")
                    ? "bg-seai-50 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
                )}
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
              >
                More
                <ChevronDown className={cn("h-4 w-4 transition-transform", moreOpen && "rotate-180")} aria-hidden="true" />
              </button>
              {moreOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  {moreNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <span className="block">{item.label}</span>
                      {item.description && (
                        <span className="mt-0.5 block text-xs font-normal text-slate-400 dark:text-slate-500">{item.description}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              href={site.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <Github className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">GitHub repository</span>
              <span className="hidden xl:inline">GitHub</span>
            </Link>
            <Button variant="primary" size="sm" asChild>
              <Link href="/docs/getting-started">
                Build a Mind
                <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <button
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col gap-1">
              <Link
                href="/docs/getting-started"
                onClick={() => setMobileOpen(false)}
                className="mb-1 flex items-center justify-center gap-2 rounded-xl bg-seai-600 px-3 py-2.5 text-sm font-semibold text-white"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Build a Mind
              </Link>
              {[
                ...primaryNav.map((i) => ({ ...i, description: undefined })),
                ...moreNav.map((i) => ({ ...i, group: "More" })),
              ].map((item) => (
                <div key={item.href}>
                  {"group" in item && (
                    <p className="mt-3 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      More
                    </p>
                  )}
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive(pathname, item.href)
                        ? "bg-seai-50 text-seai-700 dark:bg-seai-900/50 dark:text-seai-300"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
              <hr className="my-2 border-slate-200 dark:border-slate-700" />
              <Link
                href={site.github}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Github className="h-5 w-5" aria-hidden="true" />
                GitHub — M4G3LL4N0/seai-mind
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
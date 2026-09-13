import Link from "next/link";
import { Github, ExternalLink } from "lucide-react";
import { footerGroups, footerIntro, site } from "@/lib/content";

export function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="container-wide py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-10">
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4" aria-label="SE-AI Home">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SE-AI</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-darwin-100 text-darwin-700 dark:bg-darwin-900/50 dark:text-darwin-300 rounded-full">
                {footerIntro.badge}
              </span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-sm leading-relaxed">{footerIntro.text}</p>
            <a
              href={site.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-seai-300 hover:text-seai-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-seai-700 dark:hover:text-seai-400"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              {site.githubRepo}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          {footerGroups.map((group) => (
            <nav key={group.label} aria-label={group.label}>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{group.label}</h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-seai-600 dark:text-slate-400 dark:hover:text-seai-400 transition-colors"
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-slate-600 hover:text-seai-600 dark:text-slate-400 dark:hover:text-seai-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} SE-AI. Open source — see the{" "}
              <Link href="/license" className="underline underline-offset-2 hover:text-seai-600 dark:hover:text-seai-400">
                license page
              </Link>{" "}
              for the current status.
            </p>
            <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/privacy" className="hover:text-seai-600 dark:hover:text-seai-400">Privacy</Link>
              <Link href="/security" className="hover:text-seai-600 dark:hover:text-seai-400">Security</Link>
              <Link href="/roadmap" className="hover:text-seai-600 dark:hover:text-seai-400">Roadmap</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { PageHeader, CardLink } from "@/components/ui/Page";
import { architectureModules, dependencyChain, architectureFacts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Architecture",
  description:
    "Seven build units, one dependency direction: core ← runtime/state ← mind ← sdk ← cli, with web standalone. Provider-neutral execution, Mind-scoped memory.",
};

const docsFor: Record<string, string> = {
  core: "/docs/architecture",
  runtime: "/docs/runtime",
  state: "/docs/memory",
  mind: "/docs/minds",
  sdk: "/docs/sdk",
  cli: "/docs/cli",
  web: "/docs/architecture",
};

export default function ArchitecturePage() {
  return (
    <>
      <Navigation />
      <main>
        <PageHeader
          eyebrow="Architecture"
          title="Seven Build Units, One Dependency Direction"
          lede="A pnpm monorepo with a four-layer kernel and three interfaces. Every unit is replaceable without breaking the stack."
        />
        <div className="container-wide py-16 lg:py-20">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 font-mono text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              core ← runtime/state ← mind ← sdk ← cli&nbsp;&nbsp;·&nbsp;&nbsp;web (standalone)
            </div>
            <div className="grid grid-cols-1 gap-4">
              {architectureModules.map((mod) => (
                <div key={mod.slug} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <code className="rounded-lg bg-seai-50 px-2.5 py-1 text-sm font-bold text-seai-700 dark:bg-seai-900/40 dark:text-seai-300">
                      {mod.name}
                    </code>
                    <code className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {mod.path}
                    </code>
                    <span
                      className={
                        mod.layer === "kernel"
                          ? "rounded-full bg-seai-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-seai-700 dark:bg-seai-900/40 dark:text-seai-300"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }
                    >
                      {mod.layer}
                    </span>
                    {mod.dependsOn.length > 0 && (
                      <span className="text-xs text-slate-400">
                        depends on: <code className="text-slate-500 dark:text-slate-400">{mod.dependsOn.join(", ")}</code>
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-3">{mod.role}</p>
                  <ul className="space-y-1.5">
                    {mod.responsibilities.map((r) => (
                      <li key={r} className="flex gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-seai-400" aria-hidden="true" />
                        {r}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <CardLink href={docsFor[mod.slug]} title={`Read the ${mod.name} docs`} />
                  </div>
                </div>
              ))}
            </div>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Structural facts</h2>
              <ul className="space-y-2">
                {architectureFacts.map((fact) => (
                  <li key={fact} className="flex gap-3 leading-relaxed text-slate-600 dark:text-slate-400">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-darwin-500" aria-hidden="true" />
                    {fact}
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CardLink href="/docs/architecture" title="Architecture docs" description="The dependency tree in full and the reasons behind it." />
              <CardLink href="/docs/runtime" title="Runtime docs" description="Powered by provider-neutral execution — how adapters plug in." />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
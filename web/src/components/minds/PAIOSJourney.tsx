"use client";

import { useState } from "react";
import {
  Activity,
  ArrowRight,
  Check,
  CircleUserRound,
  Database,
  Fingerprint,
  Gauge,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

const requestSteps = [
  {
    title: "Start with a task",
    label: "Request",
    description:
      "PAIOS receives a task in the context of a named Mind. The model is an execution option, not the whole application.",
  },
  {
    title: "Assemble the Mind",
    label: "Context",
    description:
      "The active Mind brings its identity, goals, and relevant memory together with validated skills. Memory stays scoped to its mindId.",
  },
  {
    title: "Enforce policy, then route",
    label: "Execution",
    description:
      "The cognition path tries deterministic handling, a skill, or a permitted tool before a model call. The runtime registry selects an available provider under the Mind's policy.",
  },
  {
    title: "Return a result you can inspect",
    label: "Result",
    description:
      "PAIOS returns the result with its execution trace. Evaluation records are created for explicit task suites; an ordinary conversation does not silently rewrite the Mind.",
  },
  {
    title: "Improve as a separate operation",
    label: "Evolution",
    description:
      "A proposed change is versioned and measured against the same workload as its baseline, then checked on protected holdout tasks. The gate can hold or reject it; an eligible candidate still needs an explicit human promotion decision.",
  },
];

const runtimeNodes: { title: string; detail: string; icon: LucideIcon }[] = [
  {
    title: "Request",
    detail: "Task + active Mind",
    icon: CircleUserRound,
  },
  {
    title: "Mind context",
    detail: "Identity · goals · scoped memory · skills",
    icon: Fingerprint,
  },
  {
    title: "Policy + runtime",
    detail: "Permission checks · provider routing",
    icon: LockKeyhole,
  },
  {
    title: "Result + trace",
    detail: "Response · tool record · evaluation evidence",
    icon: Activity,
  },
];

const evolutionNodes: { title: string; detail: string; icon: LucideIcon }[] = [
  {
    title: "Candidate",
    detail: "Versioned change",
    icon: Sparkles,
  },
  {
    title: "Evaluation",
    detail: "Baseline · candidate · holdout",
    icon: Gauge,
  },
  {
    title: "Human decision",
    detail: "Promote · hold · reject",
    icon: ShieldCheck,
  },
  {
    title: "Verify or restore",
    detail: "Fresh process · rollback",
    icon: RotateCcw,
  },
];

export function PAIOSJourney() {
  const [activeStep, setActiveStep] = useState(0);
  const selected = requestSteps[activeStep];

  return (
    <section
      aria-labelledby="paios-journey-title"
      className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="max-w-3xl">
        <p className="eyebrow text-seai-700 dark:text-seai-300">
          PAIOS / how the system runs
        </p>
        <h2
          id="paios-journey-title"
          className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white"
        >
          A personal assistant with a real system behind it.
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
          PAIOS wraps a model in persistent state, skills, tools, runtime
          selection, and policy. A request follows the execution path below.
          Improving that path is a separate, reviewable operation.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Walk through one request
          </p>
          <ol className="space-y-2">
            {requestSteps.map((step, index) => (
              <li key={step.label}>
                <button
                  type="button"
                  aria-pressed={activeStep === index}
                  aria-controls="paios-step-detail"
                  onClick={() => setActiveStep(index)}
                  className="paios-step-button flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/80 font-mono text-xs font-semibold text-seai-800 dark:bg-slate-800 dark:text-seai-200">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-semibold">{step.title}</span>
                  <ArrowRight
                    className="ml-auto h-4 w-4 shrink-0 opacity-60"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ol>

          <motion.div
            id="paios-step-detail"
            key={activeStep}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            aria-live="polite"
            className="mt-4 rounded-2xl bg-slate-50 p-5 dark:bg-slate-950"
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-seai-700 dark:text-seai-300">
              {selected.label}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
              {selected.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {selected.description}
            </p>
          </motion.div>
        </div>

        <div className="space-y-6">
          <figure
            aria-label="PAIOS runtime and governed evolution diagram"
            className="paios-flow-track rounded-3xl border border-seai-200 bg-seai-50/70 p-4 sm:p-5 dark:border-seai-800 dark:bg-slate-950"
          >
            <figcaption className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-seai-800 dark:text-seai-200">
              <Database className="h-4 w-4" aria-hidden="true" />
              Runtime path
            </figcaption>
            <p className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Request <span aria-hidden="true">→</span> Mind context{" "}
              <span aria-hidden="true">→</span> Policy and runtime{" "}
              <span aria-hidden="true">→</span> Result
            </p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {runtimeNodes.map((node, index) => (
                <motion.div
                  key={node.title}
                  animate={{
                    borderColor:
                      Math.min(activeStep, 3) === index ? "#7eaa84" : "#dce3db",
                    y: Math.min(activeStep, 3) === index ? -2 : 0,
                  }}
                  transition={{ duration: 0.22 }}
                  className="rounded-2xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-2 text-seai-700 dark:text-seai-300">
                    <node.icon className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-950 dark:text-white">
                    {node.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                    {node.detail}
                  </p>
                </motion.div>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
              <Wrench
                className="mt-0.5 h-4 w-4 shrink-0 text-seai-700 dark:text-seai-300"
                aria-hidden="true"
              />
              Local runtimes are preferred. External providers are available
              only under the user&apos;s configured consent and policy.
            </p>
          </figure>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-seai-700 dark:text-seai-300">
                  Separate learning path
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                  A conversation never self-promotes a change.
                </h3>
              </div>
              <Check
                className="h-6 w-6 shrink-0 text-seai-700 dark:text-seai-300"
                aria-hidden="true"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {evolutionNodes.map((node, index) => (
                <div
                  key={node.title}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <node.icon
                    className="mt-0.5 h-4 w-4 shrink-0 text-seai-700 dark:text-seai-300"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {String(index + 1).padStart(2, "0")} · {node.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">
                      {node.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-600 dark:text-slate-400">
              The gate decides whether a candidate is eligible. A person makes
              the promotion decision; the adopted version is verified in a
              fresh process and can be rolled back with its history intact.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

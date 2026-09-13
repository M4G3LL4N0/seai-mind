export interface SnapshotStat {
  value: string;
  label: string;
  detail?: string;
}

// CURRENT VERIFIED SNAPSHOT — Darwin 0.1, verified 2026-09-13.
// These are point-in-time facts, not live telemetry. Re-verify before the
// snapshot date changes and update `verifiedAt`.
export const snapshot = {
  label: "CURRENT VERIFIED SNAPSHOT",
  verifiedAt: "2026-09-13",
  stats: [
    { value: "7", label: "kernel build units", detail: "core · runtime · state · mind · sdk · cli · web" },
    { value: "105", label: "tests passing", detail: "core 21 · state 10 · runtime 7 · mind 59 · cli 8" },
    { value: "2", label: "live evolution experiments", detail: "measured, hash-signed, both honest about limits" },
    { value: "1", label: "reference Mind", detail: "PAIOS — Personal AI Operating System" },
  ],
  facts: [
    "Model-backed evolution demonstrated live",
    "Mind-scoped memory isolation (required mindId)",
    "Provider-neutral runtime with routing",
    "Deterministic evaluation — no LLM judge",
    "Evidence hashing + tamper detection on the store",
    "GitHub public · local development available",
  ],
} as const;

export const snapshotFootnote =
  "Snapshot facts are documented in the repository, not scraped from live telemetry.";
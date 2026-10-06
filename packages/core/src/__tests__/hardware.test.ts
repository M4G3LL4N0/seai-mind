import { describe, it, expect, vi, afterEach } from "vitest";
import os from "node:os";
import {
  createHardwareDetector,
  detectHardware,
} from "../hardware.js";
import { HardwareProfileSchema } from "../schemas.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("hardware profile degradation", () => {
  it("produces a schema-valid profile when core count is undetectable", async () => {
    // os.cpus() legitimately returns an empty array in some container and
    // test-sandbox environments, including GitHub Actions runners. Detection
    // must degrade rather than throw, or every initialize() in the system
    // fails with "Invalid hardware profile: cpu.cores".
    vi.spyOn(os, "cpus").mockReturnValue([] as never);

    const profile = await detectHardware();

    expect(profile.cpu.cores).toBeGreaterThan(0);
    expect(profile.cpu.threads).toBeGreaterThan(0);
    expect(HardwareProfileSchema.safeParse(profile).success).toBe(true);
  });

  it("reports the real core count when detection succeeds", async () => {
    const real = os.cpus().length;
    if (real === 0) return; // nothing to compare against on this host

    const profile = await detectHardware();
    expect(profile.cpu.cores).toBe(real);
  });

  it("always returns a detector for the current platform", () => {
    expect(createHardwareDetector()).toBeDefined();
  });
});
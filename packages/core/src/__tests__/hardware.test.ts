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

  it("keeps cores and threads consistent with each other", async () => {
    // The per-platform detectors do not all read the same source: darwin uses
    // os.cpus() and sysctl, linux shells out to `lscpu -J`. So this asserts
    // internal consistency rather than equality with os.cpus(), which is only
    // the source of truth on one platform and was a wrong assumption that made
    // this test fail on CI while the code was correct.
    const profile = await detectHardware();
    expect(profile.cpu.cores).toBeGreaterThan(0);
    expect(profile.cpu.threads).toBeGreaterThanOrEqual(profile.cpu.cores);
  });

  it("always returns a detector for the current platform", () => {
    expect(createHardwareDetector()).toBeDefined();
  });
});
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as os from "node:os";

import {
  HardwareProfileSchema,
  type HardwareProfile,
  type Version,
} from "./schemas.js";

export type { HardwareProfile };

export interface HardwareDetector {
  detect(): Promise<HardwareProfile>;
}

export class DarwinHardwareDetector implements HardwareDetector {
  async detect(): Promise<HardwareProfile> {
    const [cpu, memory, gpu, storage, os, battery, thermal, load] = await Promise.all([
      this.detectCPU(),
      this.detectMemory(),
      this.detectGPU(),
      this.detectStorage(),
      this.detectOS(),
      this.detectBattery(),
      this.detectThermal(),
      this.detectLoad(),
    ]);

    const profile: HardwareProfile = {
      cpu,
      memory,
      gpu,
      storage,
      os,
      battery,
      thermal,
      load,
    };

    const result = HardwareProfileSchema.safeParse(profile);
    if (!result.success) {
      throw new Error(`Invalid hardware profile: ${result.error.message}`);
    }

    return result.data;
  }

  private async detectCPU() {
 const cpus = os.cpus();
    const totalCpus = cpus.length;
    
    let model = "Unknown";
    let frequencyMHz = 0;
    
    if (cpus.length > 0) {
      model = cpus[0].model;
      frequencyMHz = cpus[0].speed;
    }

    let architecture = process.arch;
    
    if (process.platform === "darwin") {
      try {
        const { stdout } = await this.exec("sysctl", ["-n", "machdep.cpu.brand_string"]);
        model = stdout.trim() || model;
      } catch {}
      
      try {
        const { stdout } = await this.exec("sysctl", ["-n", "hw.optional.arm64"]);
        if (stdout.trim() === "1") {
          architecture = "arm64";
        }
      } catch {}
    }

    return {
      architecture,
      cores: totalCpus,
      threads: totalCpus,
      model,
      frequencyMHz,
    };
  }

  private async detectMemory() {
    const totalBytes = os.totalmem();
    const freeBytes = os.freemem();
    
    let unified = false;
    if (process.platform === "darwin") {
      try {
        const { stdout } = await this.exec("sysctl", ["-n", "hw.memsize"]);
        const memsize = parseInt(stdout.trim(), 10);
        if (memsize === totalBytes) {
          unified = true;
        }
      } catch {}
    }

    return {
      totalBytes,
      availableBytes: freeBytes,
      unified,
    };
  }

  private async detectGPU() {
    if (process.platform === "darwin") {
      try {
        const { stdout } = await this.exec("system_profiler", ["SPDisplaysDataType", "-json"]);
        const data = JSON.parse(stdout);
        const displays = data.SPDisplaysDataType?.[0]?.spdisplays_ndrvs || [];
        
        if (displays.length > 0) {
          const gpu = displays[0];
          return {
            present: true,
            vendor: gpu.sppci_vendor || "Apple",
            model: gpu._name || "Apple GPU",
            memoryBytes: gpu.sppci_vram ? this.parseMemoryString(gpu.sppci_vram) : undefined,
            cores: gpu.spdisplays_gpu_cores ? parseInt(gpu.spdisplays_gpu_cores, 10) : undefined,
            metalSupport: gpu.spdisplays_metal ? `Metal ${gpu.spdisplays_metal}` : "Metal",
            cudaSupport: false,
            rocmSupport: false,
          };
        }
      } catch {}
    }

    if (process.platform === "linux") {
      try {
        const { stdout } = await this.exec("nvidia-smi", ["--query-gpu=name,memory.total,driver_version", "--format=csv,noheader,nounits"]);
        const lines = stdout.trim().split("\n");
        if (lines.length > 0 && lines[0]) {
          const [name, memory, driver] = lines[0].split(", ");
          return {
            present: true,
            vendor: "NVIDIA",
            model: name,
            memoryBytes: parseInt(memory, 10) * 1024 * 1024,
            cores: undefined,
            metalSupport: undefined,
            cudaSupport: true,
            rocmSupport: false,
          };
        }
      } catch {}
      
      try {
        const { stdout } = await this.exec("rocm-smi", ["--showproductname", "--showmeminfo", "vram", "--json"]);
        const data = JSON.parse(stdout);
        if (data.card0) {
          return {
            present: true,
            vendor: "AMD",
            model: data.card0.CardSeries || "AMD GPU",
            memoryBytes: data.card0.VRAM?.Total ? parseInt(data.card0.VRAM.Total, 10) * 1024 * 1024 : undefined,
            cores: undefined,
            metalSupport: undefined,
            cudaSupport: false,
            rocmSupport: true,
          };
        }
      } catch {}
    }

    return {
      present: false,
      vendor: undefined,
      model: undefined,
      memoryBytes: undefined,
      cores: undefined,
      metalSupport: undefined,
      cudaSupport: false,
      rocmSupport: false,
    };
  }

  private async detectAccelerator() {
    if (process.platform === "darwin") {
      try {
        const { stdout } = await this.exec("sysctl", ["-n", "hw.optional.arm.FEAT_SVE"]);
        if (stdout.trim() === "1") {
          return {
            present: true,
            type: "Apple Neural Engine",
            model: "ANE",
            memoryBytes: undefined,
          };
        }
      } catch {}
    }
    
    return undefined;
  }

  private async detectStorage() {
    const platform = process.platform;
    
    if (platform === "darwin") {
      try {
        const { stdout } = await this.exec("df", ["-k", "/"]);
        const lines = stdout.trim().split("\n");
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          const totalKB = parseInt(parts[1], 10);
          const availableKB = parseInt(parts[3], 10);
          return {
            type: "APFS",
            availableBytes: availableKB * 1024,
            totalBytes: totalKB * 1024,
          };
        }
      } catch {}
    } else if (platform === "linux") {
      try {
        const { stdout } = await this.exec("df", ["-k", "/"]);
        const lines = stdout.trim().split("\n");
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          const totalKB = parseInt(parts[1], 10);
          const availableKB = parseInt(parts[3], 10);
          return {
            type: "ext4",
            availableBytes: availableKB * 1024,
            totalBytes: totalKB * 1024,
          };
        }
      } catch {}
    }

    const totalBytes = os.totalmem() * 10;
    const availableBytes = os.freemem() * 10;
    
    return {
      type: "unknown",
      availableBytes,
      totalBytes,
    };
  }

  private async detectOS() {
    return {
      platform: os.platform(),
      release: os.release(),
      version: os.version(),
    };
  }

  private async detectBattery() {
    if (process.platform === "darwin") {
      try {
        const { stdout } = await this.exec("pmset", ["-g", "batt"]);
        const lines = stdout.trim().split("\n");
        if (lines.length > 1) {
          const line = lines[1];
          const charging = line.includes("charging") || line.includes("AC Power");
          const match = line.match(/(\d+)%/);
          const level = match ? parseInt(match[1], 10) / 100 : undefined;
          return { present: true, level, charging };
        }
      } catch {}
    }
    
    if (process.platform === "linux") {
      try {
        const { stdout } = await this.exec("cat", ["/sys/class/power_supply/BAT0/capacity"]);
        const level = parseInt(stdout.trim(), 10) / 100;
        const { stdout: status } = await this.exec("cat", ["/sys/class/power_supply/BAT0/status"]);
        const charging = status.trim() === "Charging";
        return { present: true, level, charging };
      } catch {}
    }
    
    return { present: false };
  }

  private async detectThermal() {
    if (process.platform === "darwin") {
      try {
        const { stdout } = await this.exec("osx-cpu-temp", []);
        const temp = parseFloat(stdout.trim());
        if (!isNaN(temp)) {
          return {
            supported: true,
            temperatureCelsius: temp,
            throttleState: temp > 80 ? "throttling" : "normal",
          };
        }
      } catch {}
      
      try {
        const { stdout } = await this.exec("sudo", ["powermetrics", "--samplers", "smc", "-n", "1", "-i", "100"]);
        const tempMatch = stdout.match(/CPU die temperature:\s+([\d.]+)\s*C/);
        if (tempMatch) {
          const temp = parseFloat(tempMatch[1]);
          return {
            supported: true,
            temperatureCelsius: temp,
            throttleState: temp > 80 ? "throttling" : "normal",
          };
        }
      } catch {}
    }
    
    if (process.platform === "linux") {
      try {
        const { stdout } = await this.exec("cat", ["/sys/class/thermal/thermal_zone0/temp"]);
        const temp = parseInt(stdout.trim(), 10) / 1000;
        return {
          supported: true,
          temperatureCelsius: temp,
          throttleState: temp > 80 ? "throttling" : "normal",
        };
      } catch {}
    }
    
    return { supported: false };
  }

  private async detectLoad() {
    const loadavg = os.loadavg();
    return {
      average1m: loadavg[0],
      average5m: loadavg[1],
      average15m: loadavg[2],
    };
  }

  private parseMemoryString(str: string): number {
    const match = str.match(/([\d.]+)\s*(\w+)/);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    switch (unit) {
      case "KB": return value * 1024;
      case "MB": return value * 1024 * 1024;
      case "GB": return value * 1024 * 1024 * 1024;
      default: return value;
    }
  }

  private exec(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args);
      let stdout = "";
      let stderr = "";
      
      child.stdout.on("data", (data) => { stdout += data.toString(); });
      child.stderr.on("data", (data) => { stderr += data.toString(); });
      
      child.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed: ${command} ${args.join(" ")} - ${stderr}`));
        }
      });
      
      child.on("error", (error) => {
        reject(error);
      });
    });
  }
}

export class LinuxHardwareDetector implements HardwareDetector {
  async detect(): Promise<HardwareProfile> {
    const [cpu, memory, gpu, accelerator, storage, os, battery, thermal, load] = await Promise.all([
      this.detectCPU(),
      this.detectMemory(),
      this.detectGPU(),
      this.detectAccelerator(),
      this.detectStorage(),
      this.detectOS(),
      this.detectBattery(),
      this.detectThermal(),
      this.detectLoad(),
    ]);

    const profile: HardwareProfile = {
      cpu,
      memory,
      gpu,
      accelerator,
      storage,
      os,
      battery,
      thermal,
      load,
    };

    const result = HardwareProfileSchema.safeParse(profile);
    if (!result.success) {
      throw new Error(`Invalid hardware profile: ${result.error.message}`);
    }

    return result.data;
  }

  private async detectCPU() {
    try {
      const { stdout } = await this.exec("lscpu", ["-J"]);
      const data = JSON.parse(stdout);
      const cpuInfo = data.lscpu || [];
      const getValue = (field: string) => cpuInfo.find((c: any) => c.field === field)?.data || "";
      
      return {
        architecture: getValue("Architecture") || process.arch,
        cores: parseInt(getValue("CPU(s)") || "0", 10),
        threads: parseInt(getValue("Thread(s) per core") || "1", 10) * parseInt(getValue("CPU(s)") || "0", 10),
        model: getValue("Model name"),
        frequencyMHz: parseFloat(getValue("CPU max MHz") || getValue("CPU MHz") || "0"),
      };
    } catch {
      const cpus = os.cpus();
      return {
        architecture: process.arch,
        cores: cpus.length,
        threads: cpus.length,
        model: cpus[0]?.model || "Unknown",
        frequencyMHz: cpus[0]?.speed || 0,
      };
    }
  }

  private async detectMemory() {
    try {
      const { stdout } = await this.exec("cat", ["/proc/meminfo"]);
      const lines = stdout.trim().split("\n");
      const memInfo: Record<string, number> = {};
      for (const line of lines) {
        const [key, value] = line.split(":");
        if (key && value) {
          memInfo[key.trim()] = parseInt(value.trim().split(" ")[0], 10) * 1024;
        }
      }
      return {
        totalBytes: memInfo.MemTotal || 0,
        availableBytes: memInfo.MemAvailable || memInfo.MemFree || 0,
        unified: false,
      };
    } catch {
      return {
        totalBytes: os.totalmem(),
        availableBytes: os.freemem(),
        unified: false,
      };
    }
  }

  private async detectGPU() {
    try {
      const { stdout } = await this.exec("nvidia-smi", ["--query-gpu=name,memory.total,driver_version", "--format=csv,noheader,nounits"]);
      const lines = stdout.trim().split("\n");
      if (lines.length > 0 && lines[0]) {
        const [name, memory, driver] = lines[0].split(", ");
        return {
          present: true,
          vendor: "NVIDIA",
          model: name,
          memoryBytes: parseInt(memory, 10) * 1024 * 1024,
          cores: undefined,
          metalSupport: undefined,
          cudaSupport: true,
          rocmSupport: false,
        };
      }
    } catch {}

    try {
      const { stdout } = await this.exec("rocm-smi", ["--showproductname", "--showmeminfo", "vram", "--json"]);
      const data = JSON.parse(stdout);
      if (data.card0) {
        return {
          present: true,
          vendor: "AMD",
          model: data.card0.CardSeries || "AMD GPU",
          memoryBytes: data.card0.VRAM?.Total ? parseInt(data.card0.VRAM.Total, 10) * 1024 * 1024 : undefined,
          cores: undefined,
          metalSupport: undefined,
          cudaSupport: false,
          rocmSupport: true,
        };
      }
    } catch {}

    try {
      const { stdout } = await this.exec("lspci", ["-nn"]);
      if (stdout.includes("VGA") || stdout.includes("3D")) {
        return {
          present: true,
          vendor: "Unknown",
          model: "Integrated GPU",
          memoryBytes: undefined,
          cores: undefined,
          metalSupport: undefined,
          cudaSupport: false,
          rocmSupport: false,
        };
      }
    } catch {}

    return {
      present: false,
      vendor: undefined,
      model: undefined,
      memoryBytes: undefined,
      cores: undefined,
      metalSupport: undefined,
      cudaSupport: false,
      rocmSupport: false,
    };
  }

  private async detectAccelerator() {
    try {
      const { stdout } = await this.exec("ls", ["/dev/accel"]);
      if (stdout.trim()) {
        return {
          present: true,
          type: "Accelerator",
          model: "Unknown",
          memoryBytes: undefined,
        };
      }
    } catch {}
    return undefined;
  }

  private async detectStorage() {
    try {
      const { stdout } = await this.exec("df", ["-k", "/"]);
      const lines = stdout.trim().split("\n");
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        const totalKB = parseInt(parts[1], 10);
        const availableKB = parseInt(parts[3], 10);
        return {
          type: "ext4",
          availableBytes: availableKB * 1024,
          totalBytes: totalKB * 1024,
        };
      }
    } catch {}
    return { type: "unknown", availableBytes: 0, totalBytes: 0 };
  }

  private async detectOS() {
    try {
      const { stdout } = await this.exec("cat", ["/etc/os-release"]);
      const lines = stdout.trim().split("\n");
      const info: Record<string, string> = {};
      for (const line of lines) {
        const [key, value] = line.split("=");
        if (key && value) {
          info[key] = value.replace(/"/g, "");
        }
      }
      return {
        platform: "linux",
        release: info.VERSION_ID || "unknown",
        version: info.PRETTY_NAME || "Linux",
      };
    } catch {
      return { platform: "linux", release: "unknown", version: "Linux" };
    }
  }

  private async detectBattery() {
    try {
      const { stdout } = await this.exec("cat", ["/sys/class/power_supply/BAT0/capacity"]);
      const level = parseInt(stdout.trim(), 10) / 100;
      const { stdout: status } = await this.exec("cat", ["/sys/class/power_supply/BAT0/status"]);
      const charging = status.trim() === "Charging";
      return { present: true, level, charging };
    } catch {
      return { present: false };
    }
  }

  private async detectThermal() {
    try {
      const { stdout } = await this.exec("cat", ["/sys/class/thermal/thermal_zone0/temp"]);
      const temp = parseInt(stdout.trim(), 10) / 1000;
      return {
        supported: true,
        temperatureCelsius: temp,
        throttleState: temp > 80 ? "throttling" : "normal",
      };
    } catch {
      return { supported: false };
    }
  }

  private async detectLoad() {
    try {
      const { stdout } = await this.exec("cat", ["/proc/loadavg"]);
      const parts = stdout.trim().split(" ");
      return {
        average1m: parseFloat(parts[0]),
        average5m: parseFloat(parts[1]),
        average15m: parseFloat(parts[2]),
      };
    } catch {
      const loadavg = os.loadavg();
      return {
        average1m: loadavg[0],
        average5m: loadavg[1],
        average15m: loadavg[2],
      };
    }
  }

  private exec(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args);
      let stdout = "";
      let stderr = "";
      
      child.stdout.on("data", (data) => { stdout += data.toString(); });
      child.stderr.on("data", (data) => { stderr += data.toString(); });
      
      child.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed: ${command} ${args.join(" ")} - ${stderr}`));
        }
      });
      
      child.on("error", (error) => {
        reject(error);
      });
    });
  }
}

export class WindowsHardwareDetector implements HardwareDetector {
  async detect(): Promise<HardwareProfile> {
    const [cpu, memory, gpu, storage, os, battery, load] = await Promise.all([
      this.detectCPU(),
      this.detectMemory(),
      this.detectGPU(),
      this.detectStorage(),
      this.detectOS(),
      this.detectBattery(),
      this.detectLoad(),
    ]);

    const profile: HardwareProfile = {
      cpu,
      memory,
      gpu,
      storage,
      os,
      battery,
      thermal: { supported: false },
      load,
    };

    const result = HardwareProfileSchema.safeParse(profile);
    if (!result.success) {
      throw new Error(`Invalid hardware profile: ${result.error.message}`);
    }

    return result.data;
  }

  private async detectCPU() {
    try {
      const { stdout } = await this.exec("wmic", ["cpu", "get", "Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed", "/format:csv"]);
      const lines = stdout.trim().split("\n");
      if (lines.length > 1) {
        const parts = lines[1].split(",");
        return {
          architecture: process.arch,
          cores: parseInt(parts[2] || "0", 10),
          threads: parseInt(parts[3] || "0", 10),
          model: parts[1] || "Unknown",
          frequencyMHz: parseInt(parts[4] || "0", 10),
        };
      }
    } catch {}
    
    const cpus = os.cpus();
    return {
      architecture: process.arch,
      cores: cpus.length,
      threads: cpus.length,
      model: cpus[0]?.model || "Unknown",
      frequencyMHz: cpus[0]?.speed || 0,
    };
  }

  private async detectMemory() {
    try {
      const { stdout } = await this.exec("wmic", ["OS", "get", "TotalVisibleMemorySize,FreePhysicalMemory", "/format:csv"]);
      const lines = stdout.trim().split("\n");
      if (lines.length > 1) {
        const parts = lines[1].split(",");
        const totalKB = parseInt(parts[1] || "0", 10);
        const freeKB = parseInt(parts[2] || "0", 10);
        return {
          totalBytes: totalKB * 1024,
          availableBytes: freeKB * 1024,
          unified: false,
        };
      }
    } catch {}
    
    return {
      totalBytes: os.totalmem(),
      availableBytes: os.freemem(),
      unified: false,
    };
  }

  private async detectGPU() {
    try {
      const { stdout } = await this.exec("wmic", ["path", "win32_VideoController", "get", "Name,AdapterRAM,DriverVersion", "/format:csv"]);
      const lines = stdout.trim().split("\n");
      if (lines.length > 1) {
        const parts = lines[1].split(",");
        const name = parts[1] || "Unknown";
        const vram = parseInt(parts[2] || "0", 10);
        return {
          present: true,
          vendor: name.includes("NVIDIA") ? "NVIDIA" : name.includes("AMD") ? "AMD" : "Intel",
          model: name,
          memoryBytes: vram || undefined,
          cores: undefined,
          metalSupport: undefined,
          cudaSupport: name.includes("NVIDIA"),
          rocmSupport: name.includes("AMD"),
        };
      }
    } catch {}
    
    return {
      present: false,
      vendor: undefined,
      model: undefined,
      memoryBytes: undefined,
      cores: undefined,
      metalSupport: undefined,
      cudaSupport: false,
      rocmSupport: false,
    };
  }

  private async detectStorage() {
    try {
      const { stdout } = await this.exec("wmic", ["logicaldisk", "where", "DeviceID='C:'", "get", "Size,FreeSpace", "/format:csv"]);
      const lines = stdout.trim().split("\n");
      if (lines.length > 1) {
        const parts = lines[1].split(",");
        const totalBytes = parseInt(parts[1] || "0", 10);
        const freeBytes = parseInt(parts[2] || "0", 10);
        return {
          type: "NTFS",
          availableBytes: freeBytes,
          totalBytes,
        };
      }
    } catch {}
    return { type: "unknown", availableBytes: 0, totalBytes: 0 };
  }

  private async detectOS() {
    return {
      platform: "win32",
      release: process.platform,
      version: process.version,
    };
  }

  private async detectBattery() {
    try {
      const { stdout } = await this.exec("wmic", ["path", "win32_Battery", "get", "EstimatedChargeRemaining,BatteryStatus", "/format:csv"]);
      const lines = stdout.trim().split("\n");
      if (lines.length > 1) {
        const parts = lines[1].split(",");
        const level = parseInt(parts[1] || "0", 10) / 100;
        const status = parseInt(parts[2] || "0", 10);
        const charging = status === 2;
        return { present: true, level, charging };
      }
    } catch {}
    return { present: false };
  }

  private async detectLoad() {
    const loadavg = os.loadavg();
    return {
      average1m: loadavg[0],
      average5m: loadavg[1],
      average15m: loadavg[2],
    };
  }

  private exec(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args);
      let stdout = "";
      let stderr = "";
      
      child.stdout.on("data", (data) => { stdout += data.toString(); });
      child.stderr.on("data", (data) => { stderr += data.toString(); });
      
      child.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed: ${command} ${args.join(" ")} - ${stderr}`));
        }
      });
      
      child.on("error", (error) => {
        reject(error);
      });
    });
  }
}

export function createHardwareDetector(): HardwareDetector {
  const platform = process.platform;
  if (platform === "darwin") {
    return new DarwinHardwareDetector();
  } else if (platform === "linux") {
    return new LinuxHardwareDetector();
  } else if (platform === "win32") {
    return new WindowsHardwareDetector();
  }
  throw new Error(`Unsupported platform: ${platform}`);
}

export async function detectHardware(): Promise<HardwareProfile> {
  const detector = createHardwareDetector();
  return detector.detect();
}

export function canRunModel(hardware: HardwareProfile, requirements: {
  minRamBytes?: number;
  minVramBytes?: number;
  preferredArchitecture?: string[];
  requiresAccelerator?: boolean;
}): { canRun: boolean; reasons: string[]; score: number } {
  const reasons: string[] = [];
  let score = 100;

  if (requirements.minRamBytes && hardware.memory.totalBytes < requirements.minRamBytes) {
    reasons.push(`Insufficient RAM: ${(hardware.memory.totalBytes / 1024 / 1024 / 1024).toFixed(1)}GB available, ${(requirements.minRamBytes / 1024 / 1024 / 1024).toFixed(1)}GB required`);
    score -= 30;
  }

  if (requirements.minVramBytes) {
    if (!hardware.gpu.present) {
      reasons.push("GPU required but not present");
      score -= 50;
    } else if (hardware.gpu.memoryBytes && hardware.gpu.memoryBytes < requirements.minVramBytes) {
      reasons.push(`Insufficient VRAM: ${(hardware.gpu.memoryBytes / 1024 / 1024 / 1024).toFixed(1)}GB available, ${(requirements.minVramBytes / 1024 / 1024 / 1024).toFixed(1)}GB required`);
      score -= 30;
    }
  }

  if (requirements.requiresAccelerator) {
    const hasAccelerator = hardware.gpu.present || !!hardware.accelerator?.present;
    if (!hasAccelerator) {
      reasons.push("Accelerator required but not present");
      score -= 40;
    }
  }

  if (requirements.preferredArchitecture && requirements.preferredArchitecture.length > 0) {
    if (!requirements.preferredArchitecture.includes(hardware.cpu.architecture)) {
      reasons.push(`Architecture ${hardware.cpu.architecture} not in preferred list: ${requirements.preferredArchitecture.join(", ")}`);
      score -= 10;
    }
  }

  if (hardware.load?.average1m && hardware.load.average1m > hardware.cpu.cores * 0.8) {
    reasons.push(`High system load: ${hardware.load.average1m.toFixed(2)} (${hardware.cpu.cores} cores)`);
    score -= 15;
  }

  if (hardware.thermal?.supported && hardware.thermal.temperatureCelsius && hardware.thermal.temperatureCelsius > 85) {
    reasons.push(`High temperature: ${hardware.thermal.temperatureCelsius}°C`);
    score -= 10;
  }

  if (hardware.battery?.present && hardware.battery.level !== undefined && hardware.battery.level < 0.2 && !hardware.battery.charging) {
    reasons.push(`Low battery: ${(hardware.battery.level * 100).toFixed(0)}%`);
    score -= 5;
  }

  return {
    canRun: score >= 50,
    reasons,
    score: Math.max(0, score),
  };
}

export function estimateModelPerformance(hardware: HardwareProfile, model: {
  parameterCount: number;
  quantization: string;
  contextWindow: number;
}): { tokensPerSecond: number; latencyMs: number; memoryUsage: number } {
  const baseTokensPerSecond = 50;
  const cpuFactor = Math.min(hardware.cpu.cores / 8, 2);
  const memoryFactor = Math.min(hardware.memory.totalBytes / (16 * 1024 * 1024 * 1024), 2);
  
  let acceleratorFactor = 1;
  if (hardware.gpu.present && hardware.gpu.memoryBytes) {
    const vramGB = hardware.gpu.memoryBytes / (1024 * 1024 * 1024);
    acceleratorFactor = Math.min(vramGB / 8, 4);
  } else if (hardware.accelerator?.present) {
    acceleratorFactor = 2;
  }

  const quantizationFactor = model.quantization.includes("4bit") ? 1.5 : 
                            model.quantization.includes("8bit") ? 1.2 : 1;

  const tokensPerSecond = baseTokensPerSecond * cpuFactor * memoryFactor * acceleratorFactor * quantizationFactor;
  const latencyMs = 1000 / tokensPerSecond * 100;
  const memoryUsage = model.parameterCount * (model.quantization.includes("4bit") ? 0.5 : model.quantization.includes("8bit") ? 1 : 2);

  return {
    tokensPerSecond: Math.round(tokensPerSecond),
    latencyMs: Math.round(latencyMs),
    memoryUsage: Math.round(memoryUsage),
  };
}
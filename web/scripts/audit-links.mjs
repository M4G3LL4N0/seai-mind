#!/usr/bin/env node
/**
 * Link audit for the SE-AI web site.
 *
 * 1. Discovers all routes from src/app (static + dynamic).
 * 2. Expands dynamic params using the slug sets declared in src/lib/content.
 * 3. Scans src/** for internal `href`s (string literals and simple
 *    `/${…}` template literals) and reports any that do not resolve.
 * 4. Also validates every URL emitted by sitemap.ts.
 *
 * Usage:
 *   node scripts/audit-links.mjs
 *   node scripts/audit-links.mjs --json
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(root, "src", "app");
const contentDir = join(root, "src", "lib", "content");
const srcDir = join(root, "src");

const json = process.argv.includes("--json");

// ── 1. Route discovery from src/app ─────────────────────────────────────────
const paramNameRE = /^\.\.\.\|/;

function collectRoutes(dir) {
  const routes = new Map(); // key: pattern (e.g. /docs/[...slug]) → { pattern, re, params }
  const walk = (d, segments) => {
    let entries;
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      const full = join(d, e.name);
      if (e.isDirectory()) {
        walk(full, [...segments, e.name]);
      } else if (e.name === "page.tsx" || e.name === "page.js" || e.name === "route.ts") {
        const params = [];
        const segs = segments.map((seg) => {
          const m = seg.match(/^\[(\.\.\.)?([^\]]+)\]$/);
          if (m) {
            params.push(m[1] ? "..." + m[2] : m[2]);
            return m[1] ? "**" : `:${m[2]}`;
          }
          return seg;
        });
        const pattern = "/" + segs.join("/");
        if (!routes.has(pattern)) routes.set(pattern, { pattern, re: routeToRegExp(pattern), params });
      }
    }
  };
  walk(dir, []);
  return routes;
}

function routeToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, (c) => (c === "*" ? c : "\\" + c))
    .replace(/\/\*\*$/, "(?:/.*)?")
    .replace(/\/\*$/, "(?:/[^/]+)?")
    .replace(/:\.\.\.\w+|\\\/:\w+/g, "/[^/]+");
  return new RegExp(`^${escaped}$`);
}

// ── 2. Slug sets from content files ─────────────────────────────────────────
function slugSetsFrom(contentDirPath) {
  const sets = {};
  const gather = (directory) => {
    for (const f of readdirSync(directory)) {
      const full = join(directory, f);
      if (statSync(full).isDirectory()) {
        gather(full);
      } else if (f.endsWith(".ts") && f !== "types.ts") {
        const text = readFileSync(full, "utf8");
        const matches = [...text.matchAll(/^\s*slug:\s*"([^"]+)"/gm)].map((m) => m[1]);
        if (matches.length) sets[f.replace(/\.ts$/, "")] = [...new Set(matches)];
      }
    }
  };
  gather(contentDirPath);
  return sets;
}

const slugSets = slugSetsFrom(contentDir);
const allSlugs = [...new Set(Object.values(slugSets).flat())];

const routes = collectRoutes(appDir);
const redirectMap = new Map();
try {
  const cfgText = readFileSync(join(root, "next.config.mjs"), "utf8");
  for (const m of cfgText.matchAll(/source:\s*"([^"]+)",\s*destination:\s*"([^"]+)"/g)) {
    redirectMap.set(m[1], m[2]);
  }
} catch {
  /* ignore */
}

// Build concrete route list.
const staticRoutes = [];
const dynamicRoutes = [];
for (const [pattern, record] of routes) {
  if (record.params.length === 0) {
    staticRoutes.push(pattern);
  } else {
    dynamicRoutes.push({ pattern, ...record });
  }
}

function expandDynamic(dynamicRoutes) {
  const all = [];
  for (const dr of dynamicRoutes) {
    const segs = dr.pattern.split("/").filter(Boolean);
    const expansions = segs.map((seg) => {
      if (seg.startsWith(":")) {
        const context = dr.pattern.split("/").filter(Boolean).slice(0, segs.indexOf(seg)).join("/");
        if (context.includes("docs")) return slugSets.docs || [];
        if (context.includes("minds")) return slugSets.minds || [];
        if (context.includes("research")) return slugSets.research || [];
        if (context.includes("benchmarks")) return slugSets.benchmarks || [];
        return allSlugs.length ? [...allSlugs] : ["<unknown>"];
      }
      return [seg];
    });
    let combos = [[]];
    for (const exp of expansions) {
      const next = [];
      for (const c of combos) for (const e of exp) next.push([...c, e]);
      combos = next;
    }
    for (const combo of combos) all.push("/" + combo.join("/"));
  }
  return all;
}

const concreteRoutes = [...staticRoutes, ...expandDynamic(dynamicRoutes)];

function routeExists(path) {
  const p = normalize(path);
  if (!p || !p.startsWith("/")) return null;
  const clean = p.split(/[?#]/)[0];
  if (redirectMap.has(clean)) return `redirect: ${redirectMap.get(clean)}`;
  if (concreteRoutes.includes(clean)) return true;
  for (const dr of dynamicRoutes) {
    if (dr.re.test(clean)) return true;
  }
  return false;
}

function normalize(p) {
  if (p.startsWith("/")) return p;
  return null;
}

// ── 3. Scan source for hrefs ────────────────────────────────────────────────
const problems = [];
const counts = { total: 0, internal: 0, external: 0, bad: 0 };

const hrefLiteralRE = /(?:href=|href:\s*|destination:\s*)\{?["'`]([^"'`${}]+)["'`]|href=\{\//g;
const hrefTemplateRE = /href=\{(?:`|")\/([^"`}]+)\$\{([^}]+)\}/g;

function scanFile(file, text) {
  const lines = text.split("\n");
  const check = (href, lineNo, raw) => {
    counts.total++;
    if (/^(https?:)?\/\//.test(href) || href.startsWith("#") || href.startsWith("mailto:")) {
      counts.external++;
      if (/^https?:\/\/(?!github\.com\/M4G3LL4N0)(?!fonts\.googleapis\.com)(?!fonts\.gstatic\.com)/.test(href)) {
        problems.push({ kind: "external-host", file, line: lineNo, href });
      }
      return;
    }
    if (!href.startsWith("/")) return;
    counts.internal++;

    // Dynamic single-segment routes only exist for registered slugs.
    if (href.startsWith("/docs/")) {
      const slug = href.split("/")[2];
      if (slug && (!slugSets.docs || !slugSets.docs.includes(slug))) {
        counts.bad++;
        problems.push({ kind: "dead-doc-slug", file, line: lineNo, href });
        return;
      }
    }
    if (href.startsWith("/minds/")) {
      const slug = href.split("/")[2];
      if (slug && (!slugSets.minds || !slugSets.minds.includes(slug))) {
        counts.bad++;
        problems.push({ kind: "dead-mind-slug", file, line: lineNo, href });
        return;
      }
    }
    if (href.startsWith("/research/")) {
      const slug = href.split("/")[2];
      if (slug && (!slugSets.research || !slugSets.research.includes(slug))) {
        counts.bad++;
        problems.push({ kind: "dead-research-slug", file, line: lineNo, href });
        return;
      }
    }
    if (href.startsWith("/benchmarks/")) {
      const slug = href.split("/")[2];
      if (slug && (!slugSets.benchmarks || !slugSets.benchmarks.includes(slug))) {
        counts.bad++;
        problems.push({ kind: "dead-benchmark-slug", file, line: lineNo, href });
        return;
      }
    }

    const status = routeExists(href);
    if (status !== true) {
      counts.bad++;
      problems.push({ kind: "dead-link", file, line: lineNo, href, status });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    hrefLiteralRE.lastIndex = 0;
    while ((m = hrefLiteralRE.exec(line))) {
      check(m[1], i + 1, m[0]);
    }
    hrefTemplateRE.lastIndex = 0;
    while ((m = hrefTemplateRE.exec(line))) {
      const prefix = m[1];
      let expansions = [];
      if (prefix.startsWith("docs/")) expansions = slugSets.docs || [];
      else if (prefix.startsWith("minds/")) expansions = slugSets.minds || [];
      else if (prefix.startsWith("research/")) expansions = slugSets.research || [];
      else if (prefix.startsWith("benchmarks/")) expansions = slugSets.benchmarks || [];
      else expansions = allSlugs.length ? [...allSlugs] : [];
      for (const s of expansions) {
        check(`/${prefix}${s}`, i + 1, m[0]);
      }
    }
  }
}

function walkSrc(dir, exts) {
  const out = [];
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const full = join(d, f);
      if (statSync(full).isDirectory()) walk(full);
      else if (exts.some((e) => f.endsWith(e))) out.push(full);
    }
  };
  walk(dir);
  return out;
}

for (const file of walkSrc(srcDir, [".tsx", ".ts"])) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  scanFile(relative(root, file), text);
}

// ── 4. Validate sitemap.ts URLs ─────────────────────────────────────────────
const sitemapFile = join(root, "src", "app", "sitemap.ts");
const sitemapText = readFileSync(sitemapFile, "utf8");
for (const m of sitemapText.matchAll(/route\("([^"]*)"/g)) {
  const p = m[1];
  const status = routeExists(p || "/");
  if (status !== true) {
    problems.push({ kind: "sitemap-dead", file: "src/app/sitemap.ts", line: 0, href: p, status });
  }
}

// ── Output ──────────────────────────────────────────────────────────────────
if (json) {
  console.log(JSON.stringify({ counts, problems, routes: concreteRoutes.sort() }, null, 2));
} else {
  console.log(`Routes discovered: ${concreteRoutes.length}`);
  console.log(`hrefs scanned: ${counts.total} (internal ${counts.internal}, external ${counts.external})`);
  if (problems.length === 0) {
    console.log("No problematic internal links found.");
  } else {
    console.log(`\nProblematic links (${problems.length}):`);
    for (const p of problems) {
      console.log(`  [${p.kind}] ${p.file}:${p.line} -> ${p.href}${p.status ? ` (${p.status})` : ""}`);
    }
  }
  process.exit(problems.length ? 1 : 0);
}
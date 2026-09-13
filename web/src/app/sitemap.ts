import type { MetadataRoute } from "next";
import { docSections, researchEntries, minds, experiments } from "@/lib/content";

const baseUrl = "https://seai.dev";

function route(path: string, priority = 0.7, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly") {
  return {
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    route("", 1),
    route("/what-is-seai"),
    route("/architecture"),
    route("/evolution", 0.8),
    route("/evolution/live", 0.8),
    route("/minds"),
    route("/research"),
    route("/benchmarks", 0.8),
    route("/docs", 0.8),
    route("/roadmap"),
    route("/privacy", 0.3, "yearly"),
    route("/security", 0.3, "yearly"),
    route("/license", 0.3, "yearly"),
  ];

  const mindPages = minds.map((m) => route(`/minds/${m.slug}`, 0.6));

  const researchPages = researchEntries.map((e) => route(`/research/${e.slug}`, 0.6));

  const experimentPages = experiments.map((e) => route(`/benchmarks/${e.slug}`, 0.6));

  const docPages = docSections.flatMap((group) =>
    group.docs.map((d) => route(d.href, 0.6, "monthly")),
  );

  return [...staticPages, ...mindPages, ...researchPages, ...experimentPages, ...docPages];
}
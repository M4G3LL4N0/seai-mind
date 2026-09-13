import { site } from "./site";
import type { FooterGroup, NavGroup, NavLink } from "./types";

export const primaryNav: NavLink[] = [
  { href: "/minds", label: "Minds", description: "What a Mind is and the PAIOS reference Mind" },
  { href: "/evolution", label: "Evolution", description: "The measured evolution lifecycle" },
  { href: "/research", label: "Research", description: "Hypotheses and executed experiments" },
  { href: "/benchmarks", label: "Benchmarks", description: "MindBench metrics and measured experiments" },
  { href: "/docs", label: "Docs", description: "Getting started, architecture, and reference" },
];

export const moreNav: NavLink[] = [
  { href: "/what-is-seai", label: "What Is SE-AI?", description: "LLM vs agent vs personal AI vs SE-AI" },
  { href: "/architecture", label: "Architecture", description: "The kernel: core, runtime, state, mind" },
  { href: "/minds/paios", label: "PAIOS", description: "The first reference SE-AI Mind" },
  { href: "/roadmap", label: "Roadmap", description: "The actual development path" },
];

export const evolutionNav: NavLink[] = [
  { href: "/evolution", label: "Evolution Lifecycle", description: "How a Mind evolves under gates" },
  { href: "/evolution/live", label: "Live Evolution", description: "The real model-backed experiments", badge: "live" },
];

export const footerGroups: FooterGroup[] = [
  {
    label: "Product",
    links: [
      { href: "/", label: "Home" },
      { href: "/what-is-seai", label: "What Is SE-AI?" },
      { href: "/architecture", label: "Architecture" },
      { href: "/roadmap", label: "Roadmap" },
    ],
  },
  {
    label: "Minds",
    links: [
      { href: "/minds", label: "Mind Gallery" },
      { href: "/minds/paios", label: "PAIOS" },
    ],
  },
  {
    label: "Evolution",
    links: [
      { href: "/evolution", label: "Evolution Lifecycle" },
      { href: "/evolution/live", label: "Live Evolution" },
    ],
  },
  {
    label: "Research",
    links: [
      { href: "/research", label: "Research" },
      { href: "/research/seai-hypotheses", label: "SE-AI Hypotheses" },
      { href: "/research/model-evolution", label: "Model Evolution" },
      { href: "/research/trustworthy-evolution", label: "Trustworthy Evolution" },
    ],
  },
  {
    label: "Docs",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/docs/getting-started", label: "Getting Started" },
      { href: "/benchmarks", label: "Benchmarks" },
      { href: site.github, label: "GitHub", external: true },
    ],
  },
  {
    label: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/security", label: "Security" },
      { href: "/license", label: "License" },
    ],
  },
];

export const footerIntro = {
  heading: "SE-AI",
  badge: "Darwin 0.1",
  text: "Open infrastructure for persistent AI Minds that improve through governed experience. Intelligence should be optimized, not merely scaled.",
};
export type FeatureStatus =
  | "complete"
  | "in-progress"
  | "partial"
  | "experimental"
  | "future";

export interface NavLink {
  href: string;
  label: string;
  description?: string;
  external?: boolean;
  badge?: string;
}

export interface NavGroup {
  label: string;
  links: NavLink[];
}

export interface FooterGroup {
  label: string;
  links: NavLink[];
}

export interface DocSection {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
}

export interface Doc {
  slug: string;
  title: string;
  description: string;
  sections: DocSection[];
  sources?: { label: string; href: string }[];
}
import Link from "next/link";
import { Github, Twitter, BookOpen, Code, Brain, Mail, ExternalLink } from "lucide-react";

interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}

const footerLinks: Record<string, FooterLink[]> = {
  platform: [
    { href: "/command", label: "Command Center" },
    { href: "/minds", label: "Mind Gallery" },
    { href: "/benchmarks", label: "Benchmarks" },
    { href: "/architecture", label: "Architecture" },
  ],
  learn: [
    { href: "/research", label: "Research" },
    { href: "/docs", label: "Documentation" },
    { href: "/darwin", label: "Darwin 0.1" },
    { href: "/releases", label: "Releases" },
  ],
  community: [
    { href: "https://github.com/seai-mind", label: "GitHub", external: true },
    { href: "https://twitter.com/seai_mind", label: "Twitter", external: true },
    { href: "https://discord.gg/seai", label: "Discord", external: true },
    { href: "/contributing", label: "Contributing" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/security", label: "Security Policy" },
    { href: "/license", label: "License" },
  ],
};

interface SocialLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

const socialLinks: SocialLink[] = [
  { href: "https://github.com/seai-mind", label: "GitHub", icon: Github, external: true },
  { href: "https://twitter.com/seai_mind", label: "Twitter", icon: Twitter, external: true },
  { href: "mailto:team@seai.dev", label: "Email", icon: Mail },
];

export function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="container-wide py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4" aria-label="SE-AI Mind Home">
              <span className="text-xl font-bold text-slate-900 dark:text-white">SE-AI</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-darwin-100 text-darwin-700 dark:bg-darwin-900/50 dark:text-darwin-300 rounded-full">
                Darwin 0.1
              </span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-xs">
              Open infrastructure for building persistent AI Minds that improve through governed experience.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                  aria-label={social.label}
                  target={social.external ? "_blank" : undefined}
                  rel={social.external ? "noopener noreferrer" : undefined}
                >
                  <social.icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Platform">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Platform</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 hover:text-seai-600 dark:text-slate-400 dark:hover:text-seai-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Learn">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Learn</h3>
            <ul className="space-y-3">
              {footerLinks.learn.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 hover:text-seai-600 dark:text-slate-400 dark:hover:text-seai-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Community">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Community</h3>
            <ul className="space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 hover:text-seai-600 dark:text-slate-400 dark:hover:text-seai-400 transition-colors flex items-center gap-1.5"
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                  >
                    {link.label}
                    {link.external && <ExternalLink className="h-3 w-3" aria-hidden="true" />}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 hover:text-seai-600 dark:text-slate-400 dark:hover:text-seai-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} SE-AI. Open source under MIT license.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <span>Built with Next.js</span>
              <span>TypeScript</span>
              <span>Tailwind CSS</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
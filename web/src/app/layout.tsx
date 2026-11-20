import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "SE-AI Mind — Self-Evolving AI, Built for Everyone.",
    template: "%s | SE-AI Mind",
  },
  description:
    "Open-source infrastructure for persistent AI Minds that learn through measurable, human-governed experiments. Built around explicit evaluation, user control, and reversible change.",
  keywords: [
    "self-evolving AI",
    "self evolving artificial intelligence",
    "AI Minds",
    "evolving AI",
    "AI memory",
    "AI skills",
    "small language models",
    "AI efficiency",
    "AI model routing",
    "AI evolution",
    "local AI",
  ],
  authors: [{ name: "SE-AI" }],
  creator: "SE-AI",
  publisher: "SE-AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://seai-mind.noaerth.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://seai-mind.noaerth.com",
    title: "SE-AI Mind — Self-Evolving AI, Built for Everyone.",
    description: "Open-source infrastructure for persistent AI Minds with measurable, human-governed evolution.",
    siteName: "SE-AI Mind",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
          alt: "SE-AI Mind — Open intelligence, human governance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SE-AI Mind — Self-Evolving AI, Built for Everyone.",
    description: "Open-source infrastructure for persistent AI Minds with measurable, human-governed evolution.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#090d1c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Navigation />
      <main className="min-h-[60vh] flex items-center justify-center py-28">
        <div className="max-w-md mx-auto text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-seai-600 dark:text-seai-400 mb-4">404</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">This page does not exist</h1>
          <p className="mb-8 leading-relaxed text-slate-600 dark:text-slate-400">
            We do not leave dead links lying around. If you got here from somewhere, that is a bug — start from the
            home page instead.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-seai-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-seai-700"
          >
            Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
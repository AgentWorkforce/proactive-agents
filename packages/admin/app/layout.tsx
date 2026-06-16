import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Relay Admin",
  description: "Internal admin tools for Agent Relay.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-sm font-semibold tracking-tight text-[var(--fg)] no-underline">
              Agent Relay <span className="text-[var(--fg-muted)]">/ admin</span>
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/waitlist" className="text-[var(--fg-muted)] hover:text-[var(--fg)] no-underline">
                Waitlist
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}

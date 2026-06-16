import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const admin = await requireAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Signed in as <span className="text-[var(--fg)]">{admin.email}</span>
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-[var(--fg-muted)]">Tools</h2>
        <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg-elevated)]">
          <li>
            <Link
              href="/waitlist"
              className="flex items-center justify-between px-4 py-3 text-sm no-underline hover:bg-black/20"
            >
              <span className="text-[var(--fg)]">Waitlist signups</span>
              <span className="text-[var(--fg-muted)]">→</span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

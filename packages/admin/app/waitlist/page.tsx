import Link from "next/link";
import { desc, sql } from "drizzle-orm";
import { getDb } from "@cloud/core/db/client.js";
import { waitlistEntries } from "@cloud/core/db/schema.js";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

type SearchParams = Promise<{ page?: string }>;

export default async function WaitlistPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();

  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const db = getDb();
  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(waitlistEntries)
      .orderBy(desc(waitlistEntries.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(waitlistEntries),
  ]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Waitlist</h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            {count.toLocaleString()} {count === 1 ? "signup" : "signups"}
          </p>
        </div>
        <a
          href="/waitlist/export"
          className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-sm no-underline hover:bg-black/30"
        >
          Export CSV
        </a>
      </div>

      <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg-elevated)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--fg-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Signed up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--fg-muted)]">
                  No signups yet.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.email}>
                <td className="px-4 py-2 font-mono text-[13px]">{row.email}</td>
                <td className="px-4 py-2 text-[var(--fg-muted)]">{row.source ?? "—"}</td>
                <td className="px-4 py-2 text-[var(--fg-muted)]">{row.emailStatus}</td>
                <td className="px-4 py-2 text-[var(--fg-muted)]">
                  {new Date(row.createdAt).toISOString().slice(0, 16).replace("T", " ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[var(--fg-muted)]">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/waitlist?page=${page - 1}`}
                className="rounded-md border border-[var(--border)] px-3 py-1 no-underline hover:bg-black/30"
              >
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/waitlist?page=${page + 1}`}
                className="rounded-md border border-[var(--border)] px-3 py-1 no-underline hover:bg-black/30"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

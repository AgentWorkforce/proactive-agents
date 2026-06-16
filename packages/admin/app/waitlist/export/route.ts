import { desc } from "drizzle-orm";
import { getDb } from "@cloud/core/db/client.js";
import { waitlistEntries } from "@cloud/core/db/schema.js";
import { getAdminIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";

function csvEscape(value: string | null | undefined): string {
  if (value == null) return "";
  const needsQuoting = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

export async function GET() {
  const admin = await getAdminIdentity();
  if (!admin) {
    return new Response("Forbidden", { status: 403 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(waitlistEntries)
    .orderBy(desc(waitlistEntries.createdAt));

  const header = ["email", "source", "email_status", "created_at", "updated_at"];
  const body = rows.map((row) =>
    [
      csvEscape(row.email),
      csvEscape(row.source),
      csvEscape(row.emailStatus),
      csvEscape(row.createdAt.toISOString()),
      csvEscape(row.updatedAt.toISOString()),
    ].join(","),
  );
  const csv = [header.join(","), ...body].join("\n") + "\n";

  const today = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="waitlist-${today}.csv"`,
      "cache-control": "no-store",
    },
  });
}

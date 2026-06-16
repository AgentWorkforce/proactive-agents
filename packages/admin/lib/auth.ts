import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Resource } from "sst";
import { eq } from "drizzle-orm";
import {
  SESSION_COOKIE_NAME,
  decodeSessionToken,
  type SessionClaims,
} from "@cloud/core/session/jwt.js";
import { getDb } from "@cloud/core/db/client.js";
import { users } from "@cloud/core/db/schema.js";

const ADMIN_EMAIL_DOMAIN = "agentrelay.com";

export type AdminIdentity = {
  userId: string;
  email: string;
  session: SessionClaims;
};

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  let secret: string;
  try {
    secret = Resource.AuthSessionSecret.value;
  } catch {
    return null;
  }

  const claims = decodeSessionToken(token, secret);
  if (!claims) {
    return null;
  }

  const db = getDb();
  const rows = await db
    .select({ email: users.primaryEmail })
    .from(users)
    .where(eq(users.id, claims.userId))
    .limit(1);

  const email = rows[0]?.email?.toLowerCase() ?? null;
  if (!email || !email.endsWith(`@${ADMIN_EMAIL_DOMAIN}`)) {
    return null;
  }

  return { userId: claims.userId, email, session: claims };
}

export async function requireAdmin(): Promise<AdminIdentity> {
  const admin = await getAdminIdentity();
  if (!admin) {
    redirect("/unauthorized");
  }
  return admin;
}

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@story-crawler/core";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  return session;
}

export async function requireRole(...roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    redirect("/admin?error=forbidden");
  }
  return session;
}

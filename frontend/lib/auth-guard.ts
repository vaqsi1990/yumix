import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

type Role = "USER" | "COURIER" | "RESTAURANT_OWNER" | "ADMIN";

export async function requireAuth(roles?: Role[]) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (roles && !roles.includes(session.user.role as Role)) {
    redirect("/");
  }

  return session;
}

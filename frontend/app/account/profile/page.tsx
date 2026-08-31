import AccountProfileClient from "@/components/account/AccountProfileClient";
import { serverApiFetch } from "@/lib/session";
import type { AccountUser } from "@/lib/account-api";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const data = await serverApiFetch<{ user: AccountUser }>("/account/profile");
  return <AccountProfileClient user={data.user} />;
}

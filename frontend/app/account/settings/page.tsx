import AccountSettingsClient from "@/components/account/AccountSettingsClient";
import { serverApiFetch } from "@/lib/session";
import type { UserPreferences } from "@/lib/account-api";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const data = await serverApiFetch<{ preferences: UserPreferences }>(
    "/account/preferences",
  );
  return <AccountSettingsClient preferences={data.preferences} />;
}

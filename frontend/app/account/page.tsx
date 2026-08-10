import AccountDashboardClient from "@/components/account/AccountDashboardClient";
import { serverApiFetch } from "@/lib/session";
import type { DashboardData } from "@/lib/account-api";

export const dynamic = "force-dynamic";

export default async function AccountDashboardPage() {
  let data: DashboardData | null = null;
  try {
    data = await serverApiFetch<DashboardData>("/account/dashboard");
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <p className="rounded-2xl bg-red-50 px-4 py-8 text-center text-red-700">
        დაშბორდის ჩატვირთვა ვერ მოხერხდა
      </p>
    );
  }

  return <AccountDashboardClient data={data} />;
}

import Header from "@/components/Header";
import { requireAuth } from "@/lib/auth-guard";
import RestaurantShell from "@/components/restaurant/RestaurantShell";
import { fetchShellData } from "@/lib/restaurant/api.server";

export default async function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(["RESTAURANT_OWNER", "ADMIN"]);
  const shellData = await fetchShellData();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <RestaurantShell shellData={shellData}>{children}</RestaurantShell>
    </div>
  );
}

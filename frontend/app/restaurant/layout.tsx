import Header from "@/components/Header";
import { requireAuth } from "@/lib/auth-guard";

export default async function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(["RESTAURANT_OWNER", "ADMIN"]);

  return (
    <>
      <Header />
      {children}
    </>
  );
}

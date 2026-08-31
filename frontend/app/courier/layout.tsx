import Header from "@/components/Header";
import { requireAuth } from "@/lib/auth-guard";

export default async function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(["COURIER", "ADMIN"]);

  return (
    <>
      <Header />
      {children}
    </>
  );
}

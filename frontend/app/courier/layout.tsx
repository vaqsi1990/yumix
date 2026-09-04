import Header from "@/components/Header";
import CourierShell from "@/components/courier/CourierShell";
import { requireAuth } from "@/lib/auth-guard";

export default async function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(["COURIER", "ADMIN"]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <CourierShell>{children}</CourierShell>
    </div>
  );
}

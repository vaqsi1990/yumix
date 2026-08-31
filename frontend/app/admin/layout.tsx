import Header from "@/components/Header";
import { requireAuth } from "@/lib/auth-guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(["ADMIN"]);

  return (
    <>
      <Header />
      {children}
    </>
  );
}

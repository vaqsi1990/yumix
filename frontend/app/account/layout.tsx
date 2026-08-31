import { redirect } from "next/navigation";
import CustomerAccountShell from "@/components/account/CustomerAccountShell";
import { requireAuth } from "@/lib/auth-guard";
import { serverApiFetch } from "@/lib/session";
import type { Address } from "@/lib/shop-api";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth(["USER"]);

  let defaultAddress: Address | null = null;
  try {
    const data = await serverApiFetch<{ addresses: Address[] }>("/addresses");
    defaultAddress =
      data.addresses.find((a) => a.isDefault) ?? data.addresses[0] ?? null;
  } catch {
    defaultAddress = null;
  }

  return (
    <CustomerAccountShell defaultAddress={defaultAddress}>
      {children}
    </CustomerAccountShell>
  );
}

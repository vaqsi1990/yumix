import AccountAddressesClient from "@/components/account/AccountAddressesClient";
import { serverApiFetch } from "@/lib/session";
import type { Address } from "@/lib/shop-api";

export const dynamic = "force-dynamic";

export default async function AccountAddressesPage() {
  let addresses: Address[] = [];
  try {
    const data = await serverApiFetch<{ addresses: Address[] }>("/addresses");
    addresses = data.addresses;
  } catch {
    addresses = [];
  }

  return <AccountAddressesClient initialAddresses={addresses} />;
}

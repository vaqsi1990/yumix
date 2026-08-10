import { notFound } from "next/navigation";
import AccountOrderDetailClient from "@/components/account/AccountOrderDetailClient";
import { serverApiFetch } from "@/lib/session";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
};

export default async function AccountOrderDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { success } = await searchParams;

  try {
    const data = await serverApiFetch<{ order: Parameters<typeof AccountOrderDetailClient>[0]["initialOrder"] }>(
      `/orders/${id}`,
    );
    return (
      <AccountOrderDetailClient
        initialOrder={data.order}
        showSuccess={success === "1"}
      />
    );
  } catch {
    notFound();
  }
}

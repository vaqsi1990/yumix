import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import OrderDetailClient from "@/components/orders/OrderDetailClient";
import { getSession, serverApiFetch } from "@/lib/session";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
};

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const { success } = await searchParams;

  try {
    const data = await serverApiFetch<{ order: Parameters<typeof OrderDetailClient>[0]["initialOrder"] }>(
      `/orders/${id}`,
    );

    return (
      <section className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-6">
          <Link href="/orders" className="text-sm text-[#FF0050] hover:underline">
            ← ჩემი შეკვეთები
          </Link>
          <h1 className="mt-2 text-2xl font-bold">#{data.order.orderNumber}</h1>
          {success === "1" && (
            <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              შეკვეთა წარმატებით გაიგზავნა!
            </p>
          )}
        </div>
        <OrderDetailClient initialOrder={data.order} />
      </section>
    );
  } catch {
    notFound();
  }
}

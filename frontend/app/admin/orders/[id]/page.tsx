import { notFound } from "next/navigation";
import PanelShell from "@/components/panels/PanelShell";
import AdminOrderDetailClient from "@/components/admin/orders/AdminOrderDetailClient";
import { serverApiFetch } from "@/lib/session";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  estimatedTime: number | null;
  customerNote: string | null;
  createdAt: string;
  restaurant: { id: string; name: string; phone: string };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  courier: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  coupon: { code: string } | null;
  address: {
    city: string;
    street: string;
    building: string | null;
    apartment: string | null;
    deliveryNote: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    total: number;
    product: { name: string };
    variant: { name: string } | null;
    addOns: Array<{ addon: { name: string }; quantity: number; price: number }>;
  }>;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  let order: AdminOrderDetail | null = null;
  try {
    const data = await serverApiFetch<{ order: AdminOrderDetail }>(
      `/admin/orders/${id}`,
    );
    order = data.order;
  } catch {
    order = null;
  }

  if (!order) notFound();

  return (
    <PanelShell
      title={`შეკვეთა #${order.orderNumber}`}
      subtitle={order.restaurant.name}
      backHref="/admin/orders"
    >
      <AdminOrderDetailClient initialOrder={order} />
    </PanelShell>
  );
}

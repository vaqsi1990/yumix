import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
};

export default async function OrderDetailRedirectPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { success } = await searchParams;
  redirect(
    `/account/orders/${id}${success ? `?success=${success}` : ""}`,
  );
}

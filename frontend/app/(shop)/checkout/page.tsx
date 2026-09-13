import Link from "next/link";
import { redirect } from "next/navigation";
import CheckoutView from "@/components/checkout/CheckoutView";
import type { CartViewData } from "@/components/CartView";
import { getSession, serverApiFetch, SessionApiError } from "@/lib/session";
import type { Address } from "@/lib/shop-api";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login?next=/checkout");

  let cart: CartViewData | null = null;
  let totals = null;
  let addresses: Address[] = [];
  let loadError: string | null = null;

  try {
    const [cartData, addressData] = await Promise.all([
      serverApiFetch<{
        cart: CartViewData | null;
        totals: {
          subtotal: number;
          deliveryFee: number;
          discount: number;
          total: number;
          itemCount: number;
        } | null;
      }>("/cart"),
      serverApiFetch<{ addresses: Address[] }>("/addresses"),
    ]);
    cart = cartData.cart;
    totals = cartData.totals;
    addresses = addressData.addresses;
  } catch (error) {
    loadError =
      error instanceof SessionApiError
        ? error.message
        : "შეკვეთის მონაცემების ჩატვირთვა ვერ მოხერხდა";
  }

  if (loadError) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-5 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <h1 className="text-xl font-bold text-red-800">შეკვეთის გაფორმება</h1>
          <p className="mt-3 text-red-700">{loadError}</p>
          <Link
            href="/cart"
            className="mt-6 inline-flex rounded-lg bg-[#FF0050] px-5 py-2.5 text-white hover:bg-[#e00048]"
          >
            კალათაში დაბრუნება
          </Link>
        </div>
      </section>
    );
  }

  if (!cart || !totals || cart.items.length === 0) {
    redirect("/cart");
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-5 lg:px-8">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-inter)] text-[22px] font-bold text-neutral-900 md:text-[28px]">
          შეკვეთის გაფორმება
        </h1>
        <p className="mt-1 text-neutral-500">მისამართი, გადახდა და დადასტურება</p>
      </div>
      <CheckoutView cart={cart} totals={totals} addresses={addresses} />
    </section>
  );
}

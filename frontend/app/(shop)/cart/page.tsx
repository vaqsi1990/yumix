import Link from "next/link";
import CartView, { type CartViewData } from "@/components/CartView";
import CartCountSync from "@/components/shop/CartCountSync";
import { getSession, serverApiFetch } from "@/lib/session";

export const dynamic = "force-dynamic";

type CartTotals = {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  itemCount: number;
};

export default async function CartPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-5 lg:px-8">
        <h1 className="font-[family-name:var(--font-inter)] text-[22px] font-bold text-neutral-900 md:text-[28px]">
          კალათა
        </h1>
        <div className="mt-6 rounded-2xl bg-[#F5F5F5] px-6 py-16 text-center">
          <h2 className="font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900 md:text-[20px]">
            კალათის სანახავად შედი ანგარიშში
          </h2>
          <p className="mt-2 text-[16px] text-neutral-500 md:text-[18px]">
            შეკვეთის გასაგრძელებლად საჭიროა ავტორიზაცია
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex rounded-lg bg-[#FF0050] px-5 py-2.5 text-[16px] font-medium text-white transition hover:bg-[#e00048] md:text-[18px]"
            >
              შესვლა
            </Link>
            <Link
              href="/reg"
              className="inline-flex rounded-lg border border-neutral-200 bg-white px-5 py-2.5 text-[16px] font-medium text-neutral-700 transition hover:bg-neutral-50 md:text-[18px]"
            >
              რეგისტრაცია
            </Link>
          </div>
        </div>
      </section>
    );
  }

  let cart: CartViewData | null = null;
  let totals: CartTotals | null = null;

  try {
    const data = await serverApiFetch<{
      cart: (CartViewData & {
        coupon: (CartViewData["coupon"] & {
          isActive?: boolean;
          assignedToId?: string | null;
          minimumOrder?: number | null;
        }) | null;
      }) | null;
      totals: CartTotals | null;
    }>("/cart");

    if (data.cart) {
      cart = {
        ...data.cart,
        addOns: data.cart.addOns ?? [],
        coupon: data.cart.coupon
          ? {
              id: data.cart.coupon.id,
              code: data.cart.coupon.code,
              remainingBalance: data.cart.coupon.remainingBalance,
              expiresAt: data.cart.coupon.expiresAt,
            }
          : null,
      };
    }
    totals = data.totals;
  } catch {
    cart = null;
    totals = null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-5 sm:py-8 lg:px-8">
      <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-inter)] text-[22px] font-bold text-neutral-900 md:text-[28px]">
            კალათა
          </h1>
          {totals && (
            <p className="mt-1 text-[15px] text-neutral-500 sm:text-[16px] md:text-[18px]">
              {totals.itemCount} პროდუქტი
            </p>
          )}
        </div>
        <Link
          href="/"
          className="self-start text-[15px] font-medium text-[#FF0050] hover:underline sm:self-auto sm:text-[16px] md:text-[18px]"
        >
          ← მთავარი
        </Link>
      </div>

      {totals ? <CartCountSync count={totals.itemCount} /> : null}
      <CartView cart={cart} totals={totals} />
    </section>
  );
}

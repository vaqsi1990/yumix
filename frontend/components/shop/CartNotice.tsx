"use client";

import { useCart } from "@/components/cart-context";

export default function CartNotice() {
  const { notice, clearNotice } = useCart();

  if (!notice) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--mobile-nav-height)+var(--safe-area-bottom)+var(--view-order-bar-height)+1rem)] z-[100] flex justify-center px-4 md:bottom-24">
      <div
        role="status"
        className="pointer-events-auto max-w-md rounded-xl bg-neutral-900 px-4 py-3 text-center text-sm text-white shadow-lg"
      >
        {notice}
        <button
          type="button"
          onClick={clearNotice}
          className="ml-3 text-xs text-white/70 underline"
        >
          დახურვა
        </button>
      </div>
    </div>
  );
}

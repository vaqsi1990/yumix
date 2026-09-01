"use client";

import { useCart } from "@/components/cart-context";

export default function CartNotice() {
  const { notice, clearNotice } = useCart();

  if (!notice) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4">
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

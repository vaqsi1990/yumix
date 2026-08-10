"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-context";

export default function CartCountSync({ count }: { count: number }) {
  const { setItemCount } = useCart();

  useEffect(() => {
    setItemCount(count);
  }, [count, setItemCount]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-context";

export default function CartCountSync() {
  const { refresh } = useCart();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return null;
}

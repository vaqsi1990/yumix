"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCartSummary } from "@/lib/shop-api";
import { useAuth } from "@/components/auth-context";

export default function CartBadge({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    let cancelled = false;
    async function load() {
      const data = await fetchCartSummary();
      if (!cancelled) setCount(data.itemCount);
    }
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user]);

  return (
    <Link
      href="/cart"
      onClick={onNavigate}
      className="relative hidden items-center justify-center rounded-md p-2 text-white transition hover:bg-white/10 md:inline-flex"
      aria-label="კალათა"
    >
      <svg
        className="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M6 6h15l-1.5 9h-12L5 3H2" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-[#FF0050] text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

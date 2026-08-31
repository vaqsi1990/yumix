"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ApproveRestaurantButton({
  id,
  isApproved,
}: {
  id: string;
  isApproved: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/backend/admin/restaurants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isApproved: !isApproved }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`shrink-0 rounded-lg px-3 py-1.5 text-[16px] md:text-[18px] font-medium transition disabled:opacity-60 ${
        isApproved
          ? "bg-white text-neutral-700"
          : "bg-[#FF0050] text-white"
      }`}
    >
      {loading
        ? "..."
        : isApproved
          ? "\u10d3\u10d0\u10db\u10e2\u10d9\u10d8\u10ea\u10d4\u10d1\u10e3\u10da\u10d8"
          : "\u10d3\u10d0\u10db\u10e2\u10d9\u10d8\u10ea\u10d4\u10d1\u10d0"}
    </button>
  );
}

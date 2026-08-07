"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  acceptCourierOrder,
  updateCourierOrderStatus,
} from "@/lib/shop-api";

export function CourierAcceptButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setBusy(true);
    setError("");
    try {
      await acceptCourierOrder(orderId);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "მიღება ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        size="sm"
        disabled={busy}
        onClick={() => void handleAccept()}
      >
        {busy ? "..." : "მიღება"}
      </Button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function CourierStatusButtons({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function update(status: "ON_THE_WAY" | "DELIVERED") {
    setBusy(true);
    setError("");
    try {
      await updateCourierOrderStatus(orderId, status);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "სტატუსის შეცვლა ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {status === "PICKED_UP" && (
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => void update("ON_THE_WAY")}
        >
          გზაშია
        </Button>
      )}
      {status === "ON_THE_WAY" && (
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => void update("DELIVERED")}
        >
          მიწოდებული
        </Button>
      )}
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}

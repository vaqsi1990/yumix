"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  fetchCourierStatus,
  setCourierOnlineStatus,
} from "@/lib/courier-api";

export default function CourierOnlineToggle() {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchCourierStatus()
      .then((data) => setIsOnline(data.isOnline))
      .catch(() => setIsOnline(false))
      .finally(() => setLoading(false));
  }, []);

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      const next = !isOnline;
      const data = await setCourierOnlineStatus(next);
      setIsOnline(data.isOnline);
    } catch (e) {
      setError(e instanceof Error ? e.message : "სტატუსის შეცვლა ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-[#F3F4F6] px-4 py-5 text-sm text-neutral-500">
        იტვირთება...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-neutral-900">
            {isOnline ? "🟢 Online" : "⚪ Offline"}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {isOnline
              ? "თქვენ ხელმისაწვდომი ხართ ახალი შეკვეთებისთვის"
              : "თქვენ ამჟამად შეკვეთებს არ იღებთ"}
          </p>
        </div>
        <Button
          type="button"
          variant={isOnline ? "outline" : "default"}
          className={!isOnline ? "bg-[#FF0050] hover:bg-[#e60048]" : ""}
          disabled={busy}
          onClick={() => void toggle()}
        >
          {busy ? "იცვლება..." : isOnline ? "Offline" : "Online"}
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

"use client";

import {
  ORDER_STATUS_ACTIVE_HINTS,
  ORDER_STATUS_TRACKING_LABELS,
} from "@/lib/delivery";

const STEPS = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "PICKED_UP",
  "ON_THE_WAY",
  "DELIVERED",
] as const;

const STATUS_INDEX: Record<string, number> = Object.fromEntries(
  STEPS.map((step, index) => [step, index]),
);

export default function OrderTimeline({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        {ORDER_STATUS_TRACKING_LABELS.CANCELLED}
      </div>
    );
  }

  const currentIndex = STATUS_INDEX[status] ?? 0;

  return (
    <ol className="space-y-3">
      {STEPS.map((step, index) => {
        const done = index <= currentIndex;
        const active = index === currentIndex;
        const label = ORDER_STATUS_TRACKING_LABELS[step] ?? step;
        return (
          <li key={step} className="flex items-center gap-3">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? "bg-[#FF0050] text-white"
                  : "bg-neutral-200 text-neutral-500"
              } ${active ? "ring-4 ring-[#FF0050]/20" : ""}`}
            >
              {done ? "✓" : index + 1}
            </span>
            <span
              className={`text-sm ${
                done ? "font-semibold text-neutral-900" : "text-neutral-400"
              }`}
            >
              {label}
              {active && ORDER_STATUS_ACTIVE_HINTS[step] ? (
                <span className="mt-0.5 block text-xs font-normal text-neutral-500">
                  {ORDER_STATUS_ACTIVE_HINTS[step]}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

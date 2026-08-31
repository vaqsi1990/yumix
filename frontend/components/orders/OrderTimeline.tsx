const STEPS = [
  { key: "PENDING", label: "მოლოდინში" },
  { key: "ACCEPTED", label: "მიღებული" },
  { key: "PREPARING", label: "მზადდება" },
  { key: "READY", label: "მზადაა" },
  { key: "PICKED_UP", label: "აღებულია" },
  { key: "ON_THE_WAY", label: "გზაშია" },
  { key: "DELIVERED", label: "მიწოდებული" },
] as const;

const STATUS_INDEX: Record<string, number> = Object.fromEntries(
  STEPS.map((step, index) => [step.key, index]),
);

export default function OrderTimeline({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        შეკვეთა გაუქმებულია
      </div>
    );
  }

  const currentIndex = STATUS_INDEX[status] ?? 0;

  return (
    <ol className="space-y-3">
      {STEPS.map((step, index) => {
        const done = index <= currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step.key} className="flex items-center gap-3">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? "bg-[#FF0050] text-white"
                  : "bg-neutral-200 text-neutral-500"
              } ${active ? "ring-4 ring-[#FF0050]/20" : ""}`}
            >
              {index + 1}
            </span>
            <span
              className={`text-sm ${
                done ? "font-semibold text-neutral-900" : "text-neutral-400"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

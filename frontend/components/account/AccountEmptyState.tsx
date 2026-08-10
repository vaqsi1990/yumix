import { LucideIcon } from "lucide-react";

type AccountEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export default function AccountEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: AccountEmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-[#FF0050]/10 text-[#FF0050]">
        <Icon className="size-7" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-neutral-900">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

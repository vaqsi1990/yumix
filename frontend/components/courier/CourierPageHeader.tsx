import { ReactNode } from "react";

type CourierPageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function CourierPageHeader({
  title,
  description,
  action,
}: CourierPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-[family-name:var(--font-inter)] text-2xl font-bold text-neutral-900 md:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-neutral-500 md:text-base">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

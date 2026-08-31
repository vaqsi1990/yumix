import Link from "next/link";
import { ReactNode } from "react";

type PanelCardProps = {
  href: string;
  title: string;
  description?: string;
  /** Live count from the database — shown under the title */
  count?: number;
  icon: ReactNode;
  iconBg: string;
  badge?: number | string;
};

export default function PanelCard({
  href,
  title,
  description,
  count,
  icon,
  iconBg,
  badge,
}: PanelCardProps) {
  const badgeValue = badge ?? count;
  const subtitle =
    typeof count === "number"
      ? `\u10e1\u10e3\u10da: ${count}`
      : (description ?? "");

  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl bg-[#F3F4F6] px-4 py-5 transition hover:bg-[#EBECEF]"
    >
      <div
        className={`relative flex size-14 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        {icon}
        {badgeValue !== undefined && Number(badgeValue) > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-[#FF0050] px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {badgeValue}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="font-[family-name:var(--font-inter)] text-[16px] font-bold text-neutral-900 md:text-[18px]">
          {title}
        </h3>
      
      </div>
    </Link>
  );
}

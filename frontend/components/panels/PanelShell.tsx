import Link from "next/link";
import { ReactNode } from "react";

type PanelShellProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  children: ReactNode;
};

export default function PanelShell({
  title,
  subtitle,
  backHref = "/",
  children,
}: PanelShellProps) {
  return (
    <div className="min-h-full bg-white">
      <header className="border-b border-neutral-100 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <Link
              href={backHref}
              className="text-sm font-medium text-[#FF0050] hover:underline sm:text-[16px]"
            >
              ← უკან
            </Link>
            <h1 className="mt-1 font-[family-name:var(--font-inter)] text-xl font-bold text-neutral-900 sm:text-2xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-neutral-500 sm:text-base">{subtitle}</p>
            )}
          </div>
          <Link
            href="/"
            className="hidden shrink-0 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50 sm:inline-flex sm:text-[16px]"
          >
            საიტზე დაბრუნება
          </Link>
        </div>
      </header>
      <main className="mx-auto min-w-0 max-w-7xl overflow-x-hidden px-3 py-4 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

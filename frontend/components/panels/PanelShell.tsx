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
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <Link
              href={backHref}
              className="text-[16px] font-medium text-[#FF0050] hover:underline"
            >
              ← უკან
            </Link>
            <h1 className="mt-1 font-[family-name:var(--font-inter)] text-2xl font-bold text-neutral-900">
              {title}
            </h1>
          
          </div>
          <Link
            href="/"
            className="rounded-lg border border-neutral-200 px-3 py-2 text-[16px] text-neutral-700 transition hover:bg-neutral-50"
          >
            საიტზე დაბრუნება
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

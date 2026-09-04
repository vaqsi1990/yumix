"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { COURIER_NAV } from "@/lib/courier/nav";
import { fetchCourierDashboard } from "@/lib/courier-api";
import { cn } from "@/lib/utils";

export default function CourierSidebar() {
  const pathname = usePathname();
  const [counts, setCounts] = useState({
    available: 0,
    myActive: 0,
  });

  useEffect(() => {
    void fetchCourierDashboard()
      .then((data) =>
        setCounts({
          available: data.availableCount,
          myActive: data.myActiveCount,
        }),
      )
      .catch(() => undefined);

    const timer = window.setInterval(() => {
      void fetchCourierDashboard()
        .then((data) =>
          setCounts({
            available: data.availableCount,
            myActive: data.myActiveCount,
          }),
        )
        .catch(() => undefined);
    }, 20_000);

    return () => window.clearInterval(timer);
  }, []);

  function badgeFor(href: string) {
    if (href === "/courier/available") return counts.available;
    if (href === "/courier/active") return counts.myActive;
    return 0;
  }

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <nav className="sticky top-20 space-y-1 rounded-2xl border border-neutral-200 bg-white p-3">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          კურიერის პანელი
        </p>
        {COURIER_NAV.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          const badge = badgeFor(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-[#FF0050]/10 text-[#FF0050]"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1">{label}</span>
              {badge > 0 ? (
                <span className="rounded-full bg-[#FF0050] px-2 py-0.5 text-[11px] font-semibold text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
        <div className="my-2 border-t border-neutral-100" />
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
        >
          ← საიტზე დაბრუნება
        </Link>
      </nav>
    </aside>
  );
}

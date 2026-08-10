"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_NAV } from "@/lib/account/constants";
import { cn } from "@/lib/utils";

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <nav className="sticky top-20 space-y-1 rounded-2xl border border-neutral-200 bg-white p-3">
        {ACCOUNT_NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(href);

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
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

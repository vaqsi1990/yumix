"use client";

import { ReactNode } from "react";
import AccountHeader from "./AccountHeader";
import AccountSidebar from "./AccountSidebar";
import AccountMobileNav from "./AccountMobileNav";
import type { Address } from "@/lib/shop-api";

type CustomerAccountShellProps = {
  children: ReactNode;
  defaultAddress?: Address | null;
};

export default function CustomerAccountShell({
  children,
  defaultAddress,
}: CustomerAccountShellProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <AccountHeader defaultAddress={defaultAddress} />
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <AccountSidebar />
        <div className="min-w-0 flex-1 pb-[calc(var(--mobile-nav-height)+1rem)] lg:pb-0">
          {children}
        </div>
      </div>
      <AccountMobileNav />
    </div>
  );
}

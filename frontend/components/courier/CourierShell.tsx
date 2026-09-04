"use client";

import { ReactNode } from "react";
import CourierMobileNav from "@/components/courier/CourierMobileNav";
import CourierSidebar from "@/components/courier/CourierSidebar";

export default function CourierShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-neutral-50">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <CourierSidebar />
        <div className="min-w-0 flex-1 pb-[calc(var(--mobile-nav-height)+1rem)] lg:pb-0">
          {children}
        </div>
      </div>
      <CourierMobileNav />
    </div>
  );
}

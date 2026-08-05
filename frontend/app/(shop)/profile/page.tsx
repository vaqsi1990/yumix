"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth-context";
import { getPanelHref } from "@/lib/auth-routes";

export default function ProfilePage() {
  const { user, status, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const panelHref = getPanelHref(user.role);
    if (panelHref) {
      router.replace(panelHref);
    }
  }, [user, status, router]);

  if (status === "loading" || !user || getPanelHref(user.role)) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-5">
      <h1 className="font-[family-name:var(--font-inter)] text-2xl font-semibold text-neutral-900">
        პროფილი
      </h1>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-lg font-medium text-neutral-900">{user.name}</p>
        <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
        {user.phone && (
          <p className="mt-1 text-sm text-neutral-500">{user.phone}</p>
        )}

        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 w-full rounded-lg bg-[#FF0050] py-3 text-sm font-medium text-white transition hover:bg-[#e60048]"
        >
          გამოსვლა
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-neutral-500">
        <Link href="/" className="font-medium text-[#FF0050] hover:underline">
          მთავარ გვერდზე დაბრუნება
        </Link>
      </p>
    </div>
  );
}

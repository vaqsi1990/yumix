"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-context";

export default function AuthNav({ mobile = false }: { mobile?: boolean }) {
  const { user, status, logout } = useAuth();

  if (status === "loading") return null;

  if (!user) {
    if (mobile) {
      return (
        <div className="mt-3 border-t border-white/20 pt-4">
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-medium text-[#FF0050]"
          >
            შესვლა
          </Link>
        </div>
      );
    }

    return (
      <Link
        href="/login"
        className="hidden rounded-md border border-white px-4 py-1.5 text-[16px] transition hover:bg-white/10 lg:inline-flex"
      >
        შესვლა
      </Link>
    );
  }

  const role = user.role;
  const panelHref =
    role === "ADMIN"
      ? "/admin"
      : role === "RESTAURANT_OWNER"
        ? "/restaurant"
        : role === "COURIER"
          ? "/courier"
          : null;

  const panelLabel =
    role === "ADMIN"
      ? "ადმინი"
      : role === "RESTAURANT_OWNER"
        ? "რესტორანი"
        : role === "COURIER"
          ? "კურიერი"
          : null;

  if (mobile) {
    return (
      <div className="mt-3 flex flex-col gap-2 border-t border-white/20 pt-4">
        {panelHref && panelLabel && (
          <Link
            href={panelHref}
            className="inline-flex items-center justify-center rounded-md border border-white px-4 py-2.5 text-[16px]"
          >
            {panelLabel}
          </Link>
        )}
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-medium text-[#FF0050]"
        >
          გამოსვლა
        </button>
      </div>
    );
  }

  return (
    <>
      {panelHref && panelLabel && (
        <Link
          href={panelHref}
          className="hidden rounded-md border border-white px-4 py-1.5 text-[16px] transition hover:bg-white/10 lg:inline-flex"
        >
          {panelLabel}
        </Link>
      )}
      <button
        type="button"
        onClick={() => void logout()}
        className="hidden rounded-md bg-white px-4 py-1.5 text-[16px] font-medium text-[#FF0050] transition hover:bg-white/95 lg:inline-flex"
      >
        გამოსვლა
      </button>
    </>
  );
}

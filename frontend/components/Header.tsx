"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthNav from "@/components/AuthNav";
import Logo from "@/components/Logo";

const navLinks = [
  { href: "/", label: "მთავარი" },
  { href: "/restaurants", label: "რესტორნები" },
 
  { href: "/offers", label: "აქციები" },
  { href: "/contact", label: "კონტაქტი" },
];

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BasketIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 11h14l-1.4 8.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 11Z" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <path d="M3 11h18" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

const linkClassName =
  "whitespace-nowrap font-[family-name:var(--font-inter)] text-[20px] font-medium not-italic leading-normal text-white transition hover:opacity-80";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="relative w-full overflow-x-clip bg-[#FF0050] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-5 sm:py-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-6">
          <Logo
            priority
            onDark
            onClick={() => setMenuOpen(false)}
          />

          <button
            type="button"
            className="flex min-w-0 max-w-[38%] items-center gap-1 rounded-md border border-white/90 px-2 py-1.5 text-xs transition hover:bg-white/10 sm:max-w-none sm:gap-1.5 sm:px-2.5 sm:text-sm"
          >
            <MapPinIcon className="size-3.5 shrink-0 sm:size-4" />
            <span className="truncate">თბილისი</span>
            <ChevronDownIcon className="size-3 shrink-0 opacity-90 sm:size-3.5" />
          </button>

          <nav className="ml-2 hidden flex-1 items-center justify-center gap-6 xl:gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClassName}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
           
            <Link
              href="/cart"
              aria-label="კალათა"
              className="rounded-md p-1.5 transition hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              <BasketIcon className="size-5" />
            </Link>

            <AuthNav />

            <button
              type="button"
              className="rounded-md p-1.5 transition hover:bg-white/10 lg:hidden"
              aria-label={menuOpen ? "მენიუს დახურვა" : "მენიუს გახსნა"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <CloseIcon className="size-6" />
              ) : (
                <MenuIcon className="size-6" />
              )}
            </button>
          </div>
        </div>

        <form className="mt-3 flex w-full min-w-0 items-center gap-1 rounded-xl bg-white p-1 shadow-sm sm:mt-4 sm:gap-2 sm:p-1.5 md:w-[50%]">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 px-2 sm:gap-2 sm:px-3">
            <MapPinIcon className="size-4 shrink-0 text-[#FF0050] sm:size-5" />
            <input
              type="text"
              placeholder="ძებნა"
              className="w-full min-w-0 bg-transparent py-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 sm:py-2.5 sm:text-[0.95rem]"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-[#FF0050] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#e60048] sm:px-6 sm:py-2.5 sm:text-sm"
          >
            ძებნა
          </button>
        </form>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />

      <div
        id="mobile-menu"
        className={`absolute inset-x-0 top-full z-50 w-full origin-top border-t border-white/15 bg-[#FF0050] shadow-lg transition duration-200 lg:hidden ${
          menuOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <nav className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-4 sm:px-5 lg:px-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${linkClassName} rounded-md px-2 py-2.5`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div onClick={() => setMenuOpen(false)}>
            <AuthNav mobile />
          </div>
        </nav>
      </div>
    </header>
  );
}

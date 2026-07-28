"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function SearchBox({
  basePath,
  initialQuery = "",
  placeholder,
}: {
  basePath: string;
  initialQuery?: string;
  placeholder: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  function go(query: string) {
    const next = query.trim();
    if (!next) {
      router.push(basePath);
      return;
    }
    router.push(`${basePath}?q=${encodeURIComponent(next)}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(value);
  }

  function onChange(next: string) {
    setValue(next);
    // Clearing the field (including native search clear) resets the page
    if (next.trim() === "" && initialQuery) {
      router.push(basePath);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-md items-center gap-2 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-sm sm:w-auto sm:min-w-[320px]"
    >
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[16px] text-neutral-800 outline-none placeholder:text-neutral-400"
      />
     
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-[#FF0050] px-4 py-2 text-[14px] font-medium text-white transition hover:bg-[#e00048] md:text-[16px]"
      >
        ძებნა
      </button>
    </form>
  );
}

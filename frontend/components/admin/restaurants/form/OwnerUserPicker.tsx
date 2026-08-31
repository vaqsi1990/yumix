"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ROLE_KA } from "@/lib/admin/labels";
import type { Role } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type RestaurantOwnerCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  personalId: string | null;
  role: Role;
};

type OwnerUserPickerProps = {
  users: RestaurantOwnerCandidate[];
  value: string;
  onChange: (userId: string) => void;
  error?: string;
};

function userLabel(user: RestaurantOwnerCandidate) {
  return `${user.firstName} ${user.lastName}`;
}

function matchesUser(user: RestaurantOwnerCandidate, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
  return (
    fullName.includes(q) ||
    user.firstName.toLowerCase().includes(q) ||
    user.lastName.toLowerCase().includes(q) ||
    user.email.toLowerCase().includes(q) ||
    user.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
  );
}

export default function OwnerUserPicker({
  users,
  value,
  onChange,
  error,
}: OwnerUserPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === value) ?? null,
    [users, value],
  );

  const selectedLabel = selectedUser ? userLabel(selectedUser) : "";

  useEffect(() => {
    if (selectedUser) {
      setQuery(selectedLabel);
    } else if (!value) {
      setQuery("");
    }
  }, [selectedUser, selectedLabel, value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        if (selectedUser) setQuery(selectedLabel);
        else setQuery("");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [selectedUser, selectedLabel]);

  const results = useMemo(() => {
    if (!query.trim()) return users.slice(0, 8);
    return users.filter((u) => matchesUser(u, query)).slice(0, 8);
  }, [users, query]);

  return (
    <div className="space-y-3">
      <div ref={rootRef} className="relative">
        <Input
          id="ownerId"
          type="text"
          value={query}
          placeholder="სახელი, email ან ტელეფონი..."
          autoComplete="off"
          className={cn(error && "border-destructive")}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setOpen(true);
            if (value && next !== selectedLabel) {
              onChange("");
            }
          }}
        />

        {open && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
            {results.length === 0 ? (
              <li className="px-3 py-2.5 text-[16px] md:text-[18px] text-neutral-500">
                ვერ მოიძებნა
              </li>
            ) : (
              results.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left hover:bg-neutral-50",
                      user.id === value && "bg-neutral-50",
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(user.id);
                      setQuery(userLabel(user));
                      setOpen(false);
                    }}
                  >
                    <span className="text-[16px] md:text-[18px] font-medium text-neutral-900">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-[16px] md:text-[18px] text-neutral-500">
                      {user.email} · {user.phone} · {ROLE_KA[user.role]}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {selectedUser && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[16px] md:text-[18px]">
          <p className="font-medium text-neutral-900">{selectedLabel}</p>
          <p className="mt-0.5 text-neutral-600">{selectedUser.email}</p>
          <p className="text-neutral-600">{selectedUser.phone}</p>
          {selectedUser.personalId && (
            <p className="text-neutral-600">პ/ნ: {selectedUser.personalId}</p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import { updateAccountProfile, type AccountUser } from "@/lib/account-api";
import { useAuth } from "@/components/auth-context";

export default function AccountProfileClient({ user }: { user: AccountUser }) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    birthDate: user.birthDate ? user.birthDate.slice(0, 10) : "",
    currentPassword: "",
    newPassword: "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await updateAccountProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        birthDate: form.birthDate || null,
        ...(form.newPassword
          ? {
              currentPassword: form.currentPassword,
              newPassword: form.newPassword,
            }
          : {}),
      });
      await refresh();
      setMessage("პროფილი განახლდა");
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "შენახვა ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  }

  const displayName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <div>
      <AccountPageHeader title="პროფილი" description="პირადი ინფორმაციის მართვა" />

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <Avatar
          src={user.avatar ?? undefined}
          alt={displayName}
          fallback={displayName}
          size="lg"
        />
        <div>
          <p className="text-lg font-bold">{displayName}</p>
          <p className="text-sm text-neutral-500">{user.email}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">სახელი</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">გვარი</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="phone">ტელეფონი</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">ელფოსტა</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="birthDate">დაბადების თარიღი</Label>
          <Input
            id="birthDate"
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
          />
        </div>

        <div className="border-t border-neutral-100 pt-4">
          <h2 className="mb-3 font-semibold">პაროლის შეცვლა</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="currentPassword">მიმდინარე პაროლი</Label>
              <Input
                id="currentPassword"
                type="password"
                value={form.currentPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currentPassword: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="newPassword">ახალი პაროლი</Label>
              <Input
                id="newPassword"
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={busy} className="bg-[#FF0050] hover:bg-[#e00048]">
          {busy ? "ინახება..." : "ცვლილებების შენახვა"}
        </Button>
      </form>
    </div>
  );
}

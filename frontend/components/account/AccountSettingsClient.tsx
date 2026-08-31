"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import {
  deleteAccount,
  updatePreferences,
  type UserPreferences,
} from "@/lib/account-api";
import { useAuth } from "@/components/auth-context";

export default function AccountSettingsClient({
  preferences: initial,
}: {
  preferences: UserPreferences;
}) {
  const router = useRouter();
  const { logout } = useAuth();
  const [prefs, setPrefs] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(next: Partial<UserPreferences>) {
    setBusy(true);
    setMessage("");
    try {
      const { preferences } = await updatePreferences(next);
      setPrefs(preferences);
      setMessage("პარამეტრები შენახულია");
    } catch (e) {
      alert(e instanceof Error ? e.message : "შენახვა ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAccount() {
    if (
      !confirm(
        "დარწმუნებული ხარ? ანგარიში გაუქმდება და შეკვეთის გაგრძელება შეუძლებელი იქნება.",
      )
    ) {
      return;
    }
    try {
      await deleteAccount();
      await logout();
      router.push("/");
    } catch (e) {
      alert(e instanceof Error ? e.message : "ანგარიშის წაშლა ვერ მოხერხდა");
    }
  }

  return (
    <div>
      <AccountPageHeader title="პარამეტრები" description="შეტყობინებები და ანგარიში" />

      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">შეტყობინებები</h2>
        <div className="space-y-4">
          {(
            [
              ["orderUpdates", "შეკვეთის განახლებები"],
              ["promotions", "აქციები"],
              ["newRestaurants", "ახალი რესტორნები"],
              ["discounts", "ფასდაკლებები"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key}>{label}</Label>
              <Switch
                id={key}
                checked={prefs[key]}
                disabled={busy}
                onCheckedChange={(checked) => {
                  setPrefs((p) => ({ ...p, [key]: checked }));
                  void save({ [key]: checked });
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">ენა</h2>
        <Select
          value={prefs.language}
          onValueChange={(value: UserPreferences["language"]) => {
            setPrefs((p) => ({ ...p, language: value }));
            void save({ language: value });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ka">ქართული</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ru">Русский</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">ვალუტა</h2>
        <Select value={prefs.currency} disabled>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GEL">₾ GEL</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">ანგარიში</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" asChild>
            <Link href="/account/profile">პაროლის შეცვლა</Link>
          </Button>
          <Button variant="outline" onClick={() => void logout()}>
            <LogOut className="size-4" />
            გამოსვლა
          </Button>
          <Button variant="destructive" onClick={() => void handleDeleteAccount()}>
            ანგარიშის წაშლა
          </Button>
        </div>
      </section>

      {message && <p className="mt-4 text-sm text-green-700">{message}</p>}
    </div>
  );
}

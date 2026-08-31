"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { AdminRestaurant } from "./types";
import { patchRestaurantRemote } from "./utils";

type RestaurantSettingsPanelProps = {
  restaurant: AdminRestaurant;
  onUpdated: (restaurant: AdminRestaurant) => void;
};

export default function RestaurantSettingsPanel({
  restaurant,
  onUpdated,
}: RestaurantSettingsPanelProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function patch(data: { isApproved?: boolean; isOpen?: boolean }) {
    const key = Object.keys(data).join("-");
    setSaving(key);
    setError("");
    try {
      const updated = await patchRestaurantRemote(restaurant.id, data);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "განახლება ვერ მოხერხდა");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[16px] md:text-[18px] text-destructive">
            {error}
          </p>
        )}

        <SettingRow
          label="დამტკიცებული (მაღაზიაში ჩანს)"
          checked={restaurant.settings.approved}
          disabled={saving != null}
          onCheckedChange={(checked) =>
            void patch({
              isApproved: checked,
              isOpen: checked ? true : restaurant.isOpen,
            })
          }
        />
        <SettingRow
          label="ღიაა / შეკვეთების მიღება"
          checked={restaurant.isOpen}
          disabled={saving != null || !restaurant.settings.approved}
          onCheckedChange={(checked) => void patch({ isOpen: checked })}
        />
        <SettingRow
          label="Featured რესტორანი"
          checked={restaurant.settings.featured}
          disabled
          onCheckedChange={() => undefined}
        />
      </CardContent>
    </Card>
  );
}

function SettingRow({
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
      <span className="text-[16px] md:text-[18px] font-medium">{label}</span>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
    </label>
  );
}

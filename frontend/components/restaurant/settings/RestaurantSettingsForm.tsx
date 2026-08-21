"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import PageHeader from "@/components/restaurant/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DAY_LABELS, KA, translateApiError } from "@/lib/restaurant/labels";
import { restaurantApi } from "@/lib/restaurant/api";
import type { DayOfWeek, RestaurantSettings, WorkingHour } from "@/lib/restaurant/types";
import LocationMapPicker from "@/components/maps/LocationMapPicker";
import ImageUploadField from "@/components/admin/restaurants/form/ImageUploadField";
import TimePickerInput from "@/components/admin/restaurants/form/TimePickerInput";

const WEEK_DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function toTimeInput(value: string | undefined, fallback: string) {
  const match = String(value ?? "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return fallback;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function withFullWeek(hours: WorkingHour[]): WorkingHour[] {
  const byDay = new Map(hours.map((hour) => [hour.day, hour]));
  return WEEK_DAYS.map((day) => {
    const existing = byDay.get(day);
    return {
      day,
      open: toTimeInput(existing?.open, "10:00"),
      close: toTimeInput(existing?.close, "22:00"),
      closed: existing?.closed ?? false,
    };
  });
}

export default function RestaurantSettingsForm() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await restaurantApi.settings();
      setSettings({
        ...res.settings,
        workingHours: withFullWeek(res.settings.workingHours),
      });
    } catch (e) {
      setError(
        translateApiError(e instanceof Error ? e.message : KA.failedLoad),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateField<K extends keyof RestaurantSettings>(
    key: K,
    value: RestaurantSettings[K],
  ) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  function updateWorkingHour(index: number, patch: Partial<WorkingHour>) {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workingHours: prev.workingHours.map((wh, i) =>
          i === index ? { ...wh, ...patch } : wh,
        ),
      };
    });
    setSaved(false);
  }

  function updateMapLocation(latitude: string, longitude: string) {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        latitude: latitude ? Number.parseFloat(latitude) : null,
        longitude: longitude ? Number.parseFloat(longitude) : null,
      };
    });
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    try {
      const {
        deliveryFee: _deliveryFee,
        deliveryFeePerKm: _deliveryFeePerKm,
        deliveryRadius: _deliveryRadius,
        ...ownerSettings
      } = settings;
      const res = await restaurantApi.updateSettings({
        ...ownerSettings,
        workingHours: withFullWeek(settings.workingHours),
      });
      setSettings({
        ...res.settings,
        workingHours: withFullWeek(res.settings.workingHours),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(
        translateApiError(err instanceof Error ? err.message : KA.failedSave),
      );
    }
  }

  if (loading) {
    return (
      <PageHeader title={KA.settings.title} description={KA.loading} />
    );
  }

  if (error || !settings) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error ?? KA.failedLoad}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={KA.settings.title}
        description={KA.settings.subtitle}
        actions={
          <Button onClick={handleSave}>
            <Save className="size-4" />
            {saved ? KA.saved : KA.saveChanges}
          </Button>
        }
      />

      <form onSubmit={handleSave}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">{KA.settings.general}</TabsTrigger>
            <TabsTrigger value="delivery">{KA.settings.delivery}</TabsTrigger>
            <TabsTrigger value="hours">{KA.settings.hours}</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {KA.settings.generalInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-[minmax(0,200px)_1fr] md:items-stretch">
                  <ImageUploadField
                    label={KA.settings.logo}
                    aspect="square"
                    value={settings.logo}
                    onChange={(url) => updateField("logo", url)}
                    className="mx-auto w-full md:mx-0"
                  />
                  <ImageUploadField
                    label={KA.settings.coverImage}
                    aspect="wide"
                    className="min-h-[180px] w-full sm:min-h-[200px]"
                    value={settings.coverImage}
                    onChange={(url) => updateField("coverImage", url)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rest-name">{KA.settings.restaurantName}</Label>
                  <Input
                    id="rest-name"
                    value={settings.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rest-desc">{KA.products.description}</Label>
                  <Textarea
                    id="rest-desc"
                    value={settings.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{KA.settings.phone}</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{KA.settings.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="address">{KA.settings.address}</Label>
                    <Input
                      id="address"
                      value={settings.address}
                      onChange={(e) => updateField("address", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">{KA.settings.city}</Label>
                    <Input
                      id="city"
                      value={settings.city}
                      onChange={(e) => updateField("city", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{KA.settings.mapLocation}</Label>
                  <p className="text-sm text-muted-foreground">
                    {KA.settings.mapLocationDesc}
                  </p>
                  <LocationMapPicker
                    latitude={settings.latitude?.toString() ?? ""}
                    longitude={settings.longitude?.toString() ?? ""}
                    city={settings.city}
                    addressQuery={[settings.address, settings.city]
                      .filter(Boolean)
                      .join(", ")}
                    onChange={updateMapLocation}
                    onAddressResolved={(address) => {
                      updateField(
                        "address",
                        address.street || address.displayName,
                      );
                      if (address.city) updateField("city", address.city);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">{KA.settings.acceptingOrders}</p>
                    <p className="text-sm text-muted-foreground">
                      {KA.settings.acceptingOrdersDesc}
                    </p>
                  </div>
                  <Switch
                    checked={settings.isOpen}
                    onCheckedChange={(v) => updateField("isOpen", v)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {KA.settings.deliverySettings}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {KA.settings.deliveryAdminNote}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="min-order">{KA.settings.minOrder}</Label>
                    <Input
                      id="min-order"
                      type="number"
                      min={0}
                      step={0.5}
                      value={settings.minimumOrder}
                      onChange={(e) =>
                        updateField("minimumOrder", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{KA.settings.deliveryFee}</Label>
                    <Input
                      readOnly
                      disabled
                      value={settings.deliveryFee}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{KA.settings.deliveryFeePerKm}</Label>
                    <Input
                      readOnly
                      disabled
                      value={settings.deliveryFeePerKm}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{KA.settings.deliveryRadius}</Label>
                    <Input
                      readOnly
                      disabled
                      value={settings.deliveryRadius ?? "—"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours" forceMount className="data-[state=inactive]:hidden">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {KA.settings.workingHours}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {settings.workingHours.map((wh, index) => (
                    <div
                      key={wh.day}
                      className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center"
                    >
                      <div className="w-32 font-medium">
                        {DAY_LABELS[wh.day] ?? wh.day}
                      </div>
                      <div className="flex flex-1 flex-wrap items-center gap-3">
                        <TimePickerInput
                          value={wh.open}
                          disabled={wh.closed}
                          onChange={(open) =>
                            updateWorkingHour(index, { open })
                          }
                          className="w-36"
                        />
                        <span className="text-muted-foreground">–</span>
                        <TimePickerInput
                          value={wh.close}
                          disabled={wh.closed}
                          onChange={(close) =>
                            updateWorkingHour(index, { close })
                          }
                          className="w-36"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!wh.closed}
                          onCheckedChange={(open) =>
                            updateWorkingHour(index, { closed: !open })
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {wh.closed ? KA.closed : KA.open}
                        </span>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}

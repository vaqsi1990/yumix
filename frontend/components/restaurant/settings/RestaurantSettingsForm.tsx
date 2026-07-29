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
import type { RestaurantSettings, WorkingHour } from "@/lib/restaurant/types";

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
      setSettings(res.settings);
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    try {
      const res = await restaurantApi.updateSettings(settings);
      setSettings(res.settings);
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
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{KA.settings.logoUrl}</Label>
                    <Input
                      value={settings.logo ?? ""}
                      onChange={(e) =>
                        updateField("logo", e.target.value || null)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{KA.settings.coverUrl}</Label>
                    <Input
                      value={settings.coverImage ?? ""}
                      onChange={(e) =>
                        updateField("coverImage", e.target.value || null)
                      }
                    />
                  </div>
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
                    <Label htmlFor="delivery-fee">{KA.settings.deliveryFee}</Label>
                    <Input
                      id="delivery-fee"
                      type="number"
                      min={0}
                      step={0.5}
                      value={settings.deliveryFee}
                      onChange={(e) =>
                        updateField("deliveryFee", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery-radius">
                      {KA.settings.deliveryRadius}
                    </Label>
                    <Input
                      id="delivery-radius"
                      type="number"
                      min={0}
                      value={settings.deliveryRadius ?? ""}
                      onChange={(e) =>
                        updateField(
                          "deliveryRadius",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {KA.settings.workingHours}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {settings.workingHours.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {KA.settings.noWorkingHours}
                  </p>
                ) : (
                  settings.workingHours.map((wh, index) => (
                    <div
                      key={wh.day}
                      className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center"
                    >
                      <div className="w-32 font-medium">
                        {DAY_LABELS[wh.day] ?? wh.day}
                      </div>
                      <div className="flex flex-1 flex-wrap items-center gap-3">
                        <Input
                          type="time"
                          value={wh.open}
                          disabled={wh.closed}
                          onChange={(e) =>
                            updateWorkingHour(index, { open: e.target.value })
                          }
                          className="w-32"
                        />
                        <span className="text-muted-foreground">–</span>
                        <Input
                          type="time"
                          value={wh.close}
                          disabled={wh.closed}
                          onChange={(e) =>
                            updateWorkingHour(index, { close: e.target.value })
                          }
                          className="w-32"
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
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KA } from "@/lib/restaurant/labels";
import type {
  RestaurantCoupon,
  RestaurantCouponWritePayload,
} from "@/lib/restaurant/types";

type CouponDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon?: RestaurantCoupon | null;
  onSave: (data: RestaurantCouponWritePayload) => Promise<void>;
};

function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function CouponDialog({
  open,
  onOpenChange,
  coupon,
  onSave,
}: CouponDialogProps) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState("");
  const [minimumOrder, setMinimumOrder] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = Boolean(coupon && coupon.usageCount > 0);

  useEffect(() => {
    if (!open) return;
    setCode(coupon?.code ?? "");
    setType(coupon?.type === "FIXED" ? "FIXED" : "PERCENT");
    setValue(coupon ? String(coupon.value) : "");
    setMinimumOrder(
      coupon?.minimumOrder != null ? String(coupon.minimumOrder) : "",
    );
    setUsageLimit(
      coupon?.usageLimit != null ? String(coupon.usageLimit) : "",
    );
    setStartsAt(toDateInput(coupon?.startsAt));
    setExpiresAt(toDateInput(coupon?.expiresAt));
    setIsActive(coupon?.isActive ?? true);
    setError(null);
  }, [open, coupon]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedValue = Number(value);
    if (!code.trim()) {
      setError(KA.coupons.codeRequired);
      return;
    }
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      setError(KA.coupons.valueRequired);
      return;
    }
    if (type === "PERCENT" && parsedValue > 100) {
      setError(KA.coupons.percentMax);
      return;
    }

    const minOrderRaw = minimumOrder.trim();
    const parsedMinOrder = minOrderRaw ? Number(minOrderRaw) : null;
    if (
      parsedMinOrder != null &&
      (!Number.isFinite(parsedMinOrder) || parsedMinOrder < 0)
    ) {
      setError(KA.coupons.minOrderInvalid);
      return;
    }

    const limitRaw = usageLimit.trim();
    const parsedLimit = limitRaw ? Number(limitRaw) : null;
    if (
      parsedLimit != null &&
      (!Number.isInteger(parsedLimit) || parsedLimit <= 0)
    ) {
      setError(KA.coupons.usageLimitInvalid);
      return;
    }

    if (startsAt && expiresAt && expiresAt < startsAt) {
      setError(KA.coupons.dateRangeInvalid);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        code: code.trim(),
        type,
        value: parsedValue,
        minimumOrder: parsedMinOrder,
        usageLimit: parsedLimit,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isActive,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : KA.failedSave);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {coupon ? KA.coupons.edit : KA.coupons.create}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto py-4">
            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="coupon-code">{KA.coupons.code}</Label>
              <Input
                id="coupon-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={locked}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{KA.coupons.discountType}</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as "PERCENT" | "FIXED")}
                  disabled={locked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">
                      {KA.coupons.typePercent}
                    </SelectItem>
                    <SelectItem value="FIXED">{KA.coupons.typeFixed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-value">
                  {type === "PERCENT"
                    ? KA.coupons.percentValue
                    : KA.coupons.fixedValue}
                </Label>
                <Input
                  id="coupon-value"
                  type="number"
                  min={type === "PERCENT" ? 1 : 0.01}
                  max={type === "PERCENT" ? 100 : undefined}
                  step={type === "PERCENT" ? 1 : 0.01}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={locked}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-min">{KA.coupons.minimumOrder}</Label>
                <Input
                  id="coupon-min"
                  type="number"
                  min={0}
                  step={0.01}
                  value={minimumOrder}
                  onChange={(e) => setMinimumOrder(e.target.value)}
                  placeholder={KA.optional}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-limit">{KA.coupons.usageLimit}</Label>
                <Input
                  id="coupon-limit"
                  type="number"
                  min={1}
                  step={1}
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder={KA.coupons.unlimited}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-start">{KA.coupons.startsAt}</Label>
                <Input
                  id="coupon-start"
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-expires">{KA.coupons.expiresAt}</Label>
                <Input
                  id="coupon-expires"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{KA.coupons.activeLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {KA.coupons.activeHint}
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {KA.cancel}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? KA.loading : coupon ? KA.saveChanges : KA.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

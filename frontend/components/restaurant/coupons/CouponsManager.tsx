"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  TicketPercent,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/restaurant/PageHeader";
import CouponDialog from "@/components/restaurant/coupons/CouponDialog";
import ConfirmDialog from "@/components/restaurant/ConfirmDialog";
import EmptyState from "@/components/restaurant/EmptyState";
import TableSkeleton from "@/components/restaurant/skeletons/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/restaurant/format";
import { restaurantApi } from "@/lib/restaurant/api";
import { COUPON_STATUS_LABELS, KA, translateApiError } from "@/lib/restaurant/labels";
import type {
  RestaurantCoupon,
  RestaurantCouponWritePayload,
} from "@/lib/restaurant/types";

function formatDiscount(coupon: RestaurantCoupon) {
  if (coupon.type === "PERCENT") return `${coupon.value}%`;
  return formatCurrency(coupon.value);
}

function formatUsage(coupon: RestaurantCoupon) {
  const limit =
    coupon.usageLimit != null ? String(coupon.usageLimit) : KA.coupons.unlimited;
  return `${coupon.usageCount} / ${limit}`;
}

export default function CouponsManager() {
  const [coupons, setCoupons] = useState<RestaurantCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RestaurantCoupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RestaurantCoupon | null>(
    null,
  );
  const [statusTarget, setStatusTarget] = useState<RestaurantCoupon | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await restaurantApi.coupons();
      setCoupons(res.coupons);
    } catch (e) {
      setError(
        translateApiError(e instanceof Error ? e.message : KA.failedLoad),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter((coupon) => coupon.code.toLowerCase().includes(q));
  }, [coupons, search]);

  async function handleSave(data: RestaurantCouponWritePayload) {
    try {
      if (editing) {
        await restaurantApi.updateCoupon(editing.id, data);
      } else {
        await restaurantApi.createCoupon(data);
      }
      await loadCoupons();
      setEditing(null);
    } catch (e) {
      throw new Error(
        translateApiError(e instanceof Error ? e.message : KA.failedSave),
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await restaurantApi.deleteCoupon(deleteTarget.id);
      await loadCoupons();
      setDeleteTarget(null);
    } catch (e) {
      alert(
        translateApiError(e instanceof Error ? e.message : KA.failedDelete),
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleStatus() {
    if (!statusTarget) return;
    setActionLoading(true);
    try {
      await restaurantApi.updateCouponStatus(statusTarget.id, {
        isActive: !statusTarget.isActive,
      });
      await loadCoupons();
      setStatusTarget(null);
    } catch (e) {
      alert(
        translateApiError(e instanceof Error ? e.message : KA.failedSave),
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={KA.coupons.title} description={KA.loading} />
        <TableSkeleton cols={7} rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={KA.coupons.title}
        description={KA.coupons.subtitle}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {KA.coupons.create}
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={KA.coupons.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={TicketPercent}
          title={KA.coupons.empty}
          description={KA.coupons.emptyDesc}
          actionLabel={KA.coupons.create}
          onAction={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{KA.coupons.code}</TableHead>
                  <TableHead>{KA.coupons.discount}</TableHead>
                  <TableHead>{KA.coupons.minimumOrder}</TableHead>
                  <TableHead>{KA.coupons.usage}</TableHead>
                  <TableHead>{KA.coupons.expiresAt}</TableHead>
                  <TableHead>{KA.status}</TableHead>
                  <TableHead className="text-right">{KA.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-semibold">
                      {coupon.code}
                    </TableCell>
                    <TableCell>{formatDiscount(coupon)}</TableCell>
                    <TableCell>
                      {coupon.minimumOrder != null
                        ? formatCurrency(coupon.minimumOrder)
                        : "—"}
                    </TableCell>
                    <TableCell>{formatUsage(coupon)}</TableCell>
                    <TableCell>
                      {coupon.expiresAt
                        ? formatDate(coupon.expiresAt)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {COUPON_STATUS_LABELS[coupon.status] ?? coupon.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={KA.edit}
                          onClick={() => {
                            setEditing(coupon);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={
                            coupon.isActive
                              ? KA.coupons.deactivate
                              : KA.coupons.activate
                          }
                          onClick={() => setStatusTarget(coupon)}
                        >
                          {coupon.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={KA.delete}
                          onClick={() => setDeleteTarget(coupon)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4 md:hidden">
            {filtered.map((coupon) => (
              <div
                key={coupon.id}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg font-semibold">
                      {coupon.code}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDiscount(coupon)}
                      {coupon.minimumOrder != null
                        ? ` · ${KA.coupons.minimumOrder}: ${formatCurrency(coupon.minimumOrder)}`
                        : ""}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {COUPON_STATUS_LABELS[coupon.status] ?? coupon.status}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>
                    {KA.coupons.usage}: {formatUsage(coupon)}
                  </p>
                  <p>
                    {KA.coupons.expiresAt}:{" "}
                    {coupon.expiresAt ? formatDate(coupon.expiresAt) : "—"}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(coupon);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    {KA.edit}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatusTarget(coupon)}
                  >
                    {coupon.isActive ? KA.coupons.deactivate : KA.coupons.activate}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteTarget(coupon)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    {KA.delete}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <CouponDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        coupon={editing}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={KA.coupons.deleteTitle}
        description={KA.coupons.deleteDesc.replace(
          "{code}",
          deleteTarget?.code ?? "",
        )}
        confirmLabel={KA.delete}
        variant="destructive"
        loading={actionLoading}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={
          statusTarget?.isActive
            ? KA.coupons.deactivateTitle
            : KA.coupons.activateTitle
        }
        description={
          statusTarget?.isActive
            ? KA.coupons.deactivateDesc.replace(
                "{code}",
                statusTarget?.code ?? "",
              )
            : KA.coupons.activateDesc.replace(
                "{code}",
                statusTarget?.code ?? "",
              )
        }
        confirmLabel={
          statusTarget?.isActive ? KA.coupons.deactivate : KA.coupons.activate
        }
        loading={actionLoading}
        onConfirm={handleToggleStatus}
      />
    </div>
  );
}

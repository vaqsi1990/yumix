"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KA,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/restaurant/labels";
import type { OrderStatus, PaymentStatus } from "@/lib/restaurant/types";

export type OrdersFilterState = {
  search: string;
  status: OrderStatus | "ALL";
  payment: PaymentStatus | "ALL";
  date: string;
};

type OrdersFiltersProps = {
  filters: OrdersFilterState;
  onChange: (filters: OrdersFilterState) => void;
};

export default function OrdersFilters({ filters, onChange }: OrdersFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={KA.orders.search}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.status}
        onValueChange={(v) =>
          onChange({ ...filters, status: v as OrderStatus | "ALL" })
        }
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder={KA.status} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{KA.allStatuses}</SelectItem>
          {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
            <SelectItem key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.payment}
        onValueChange={(v) =>
          onChange({ ...filters, payment: v as PaymentStatus | "ALL" })
        }
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder={KA.payment} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{KA.allPayments}</SelectItem>
          {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((p) => (
            <SelectItem key={p} value={p}>
              {PAYMENT_STATUS_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        value={filters.date}
        onChange={(e) => onChange({ ...filters, date: e.target.value })}
        className="w-full sm:w-[160px]"
      />
    </div>
  );
}

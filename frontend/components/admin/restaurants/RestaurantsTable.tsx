"use client";

import { Fragment, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Check,
  ChevronDown,
  Clock,
  Eye,
  FolderTree,
  MoreHorizontal,
  Package,
  Pencil,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatGel } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import type { AdminRestaurant } from "./types";
import { APPROVAL_BADGE, APPROVAL_LABELS, DAY_LABELS } from "./types";
import {
  categoriesLabel,
  openStatusLabel,
  openStatusVariant,
  ownerFullName,
} from "./utils";

type RestaurantsTableProps = {
  restaurants: AdminRestaurant[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onApprove: (r: AdminRestaurant) => void;
  onReject: (r: AdminRestaurant) => void;
  onSuspend: (r: AdminRestaurant) => void;
  onUnsuspend: (r: AdminRestaurant) => void;
  onDelete: (r: AdminRestaurant) => void;
};

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-[16px] font-medium text-muted-foreground md:text-[18px]">
        {label}
      </dt>
      <dd className="mt-0.5 text-[16px] text-neutral-900 md:text-[18px]">
        {children}
      </dd>
    </div>
  );
}

function RestaurantDetails({
  restaurant,
  selected,
  onToggleSelect,
  onViewDetails,
}: {
  restaurant: AdminRestaurant;
  selected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onViewDetails: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={openStatusVariant(restaurant)}>
            {openStatusLabel(restaurant)}
          </Badge>
          <Badge variant={APPROVAL_BADGE[restaurant.approvalStatus]}>
            {APPROVAL_LABELS[restaurant.approvalStatus]}
          </Badge>
          {restaurant.isSuspended && (
            <Badge variant="destructive">შეჩერებული</Badge>
          )}
          {restaurant.settings.featured && (
            <Badge variant="default">Featured</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-[16px] md:text-[18px]">
            <Checkbox
              checked={selected}
              onCheckedChange={(c) => onToggleSelect(c === true)}
            />
            არჩევა
          </label>
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            <Eye className="size-4" />
            სრული გვერდი
          </Button>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <DetailItem label="მფლობელი">{ownerFullName(restaurant)}</DetailItem>
        <DetailItem label="მფლობ. ელ-ფოსტა">
          {restaurant.owner.email}
        </DetailItem>
        <DetailItem label="მფლობ. ტელ.">{restaurant.owner.phone}</DetailItem>
        <DetailItem label="კატეგორია">
          {categoriesLabel(restaurant.categories)}
        </DetailItem>
        <DetailItem label="ქალაქი">{restaurant.city}</DetailItem>
        <DetailItem label="მისამართი">{restaurant.address}</DetailItem>
        <DetailItem label="ტელეფონი">{restaurant.phone}</DetailItem>
        <DetailItem label="ელ-ფოსტა">
          {restaurant.email ?? "—"}
        </DetailItem>
        <DetailItem label="ვებსაიტი">
          {restaurant.website ? (
            <a
              href={restaurant.website}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {restaurant.website}
            </a>
          ) : (
            "—"
          )}
        </DetailItem>
        <DetailItem label="მიწ. საფასური">
          {formatGel(restaurant.deliveryFee)}
        </DetailItem>
        <DetailItem label="კმ ტარიფი">
          {formatGel(restaurant.deliveryFeePerKm)}
        </DetailItem>
        <DetailItem label="მინ. შეკვეთა">
          {formatGel(restaurant.minimumOrder)}
        </DetailItem>
        <DetailItem label="რადიუსი">
          {restaurant.deliveryRadius != null
            ? `${restaurant.deliveryRadius} კმ`
            : "—"}
        </DetailItem>
        <DetailItem label="მიწ. დრო">
          {restaurant.estimatedDeliveryMinutes} წთ
        </DetailItem>
        <DetailItem label="პროდუქტები">
          {restaurant.totalProducts}
        </DetailItem>
        <DetailItem label="შეკვეთები">
          {restaurant.totalOrders}
        </DetailItem>
        <DetailItem label="შემოსავალი">
          {formatGel(restaurant.revenue)}
        </DetailItem>
        <DetailItem label="რეიტინგი">
          {restaurant.rating > 0
            ? `${restaurant.rating.toFixed(1)} (${restaurant.reviewCount})`
            : "—"}
        </DetailItem>
        <DetailItem label="შექმნილია">
          {formatDateTime(restaurant.createdAt)}
        </DetailItem>
        <DetailItem label="განახლება">
          {formatDateTime(restaurant.updatedAt)}
        </DetailItem>
      </dl>

      {restaurant.description && (
        <div>
          <p className="text-[16px] font-medium text-muted-foreground md:text-[18px]">
            აღწერა
          </p>
          <p className="mt-1 text-[16px] text-neutral-900 md:text-[18px]">
            {restaurant.description}
          </p>
        </div>
      )}

      {restaurant.workingHours.length > 0 && (
        <div>
          <p className="mb-2 text-[16px] font-medium text-muted-foreground md:text-[18px]">
            სამუშაო საათები
          </p>
          <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restaurant.workingHours.map((entry) => (
              <li
                key={entry.day}
                className="flex justify-between gap-2 rounded-lg bg-white px-3 py-2 text-[16px] md:text-[18px]"
              >
                <span className="text-muted-foreground">
                  {DAY_LABELS[entry.day]}
                </span>
                <span className="font-medium tabular-nums">
                  {entry.isClosed
                    ? "დაკეტილი"
                    : `${entry.openTime} – ${entry.closeTime}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RestaurantActions({
  restaurant,
  onApprove,
  onReject,
  onSuspend,
  onUnsuspend,
  onDelete,
}: {
  restaurant: AdminRestaurant;
  onApprove: (r: AdminRestaurant) => void;
  onReject: (r: AdminRestaurant) => void;
  onSuspend: (r: AdminRestaurant) => void;
  onUnsuspend: (r: AdminRestaurant) => void;
  onDelete: (r: AdminRestaurant) => void;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={() => router.push(`/admin/restaurants/${restaurant.id}`)}
        >
          <Eye className="size-4" />
          დეტალები
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.push(`/admin/restaurants/${restaurant.id}/edit`)
          }
        >
          <Pencil className="size-4" />
          რედაქტირება
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.push(`/admin/products?restaurantId=${restaurant.id}`)
          }
        >
          <Package className="size-4" />
          პროდუქტები
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.push(
                          `/admin/restaurants/${restaurant.id}?tab=menu`,
            )
          }
        >
          <FolderTree className="size-4" />
          კატეგორიები
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.push(`/admin/restaurants/${restaurant.id}?tab=orders`)
          }
        >
          <ShoppingBag className="size-4" />
          შეკვეთები
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.push(`/admin/restaurants/${restaurant.id}?tab=hours`)
          }
        >
          <Clock className="size-4" />
          სამუშაო საათები
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {restaurant.approvalStatus !== "approved" && (
          <DropdownMenuItem onClick={() => onApprove(restaurant)}>
            <Check className="size-4" />
            დამტკიცება
          </DropdownMenuItem>
        )}
        {restaurant.approvalStatus !== "rejected" && (
          <DropdownMenuItem onClick={() => onReject(restaurant)}>
            <X className="size-4" />
            უარყოფა
          </DropdownMenuItem>
        )}
        {!restaurant.isSuspended ? (
          <DropdownMenuItem onClick={() => onSuspend(restaurant)}>
            <Ban className="size-4" />
            შეჩერება
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onUnsuspend(restaurant)}>
            <Check className="size-4" />
            გააქტიურება
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(restaurant)}
        >
          <Trash2 className="size-4" />
          წაშლა
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function RestaurantsTable({
  restaurants,
  selectedIds,
  onSelectionChange,
  onApprove,
  onReject,
  onSuspend,
  onUnsuspend,
  onDelete,
}: RestaurantsTableProps) {
  const router = useRouter();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleOne(id: string, checked: boolean) {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectionChange(next);
  }

  if (restaurants.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        რესტორნები ვერ მოიძებნა
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead className="w-14">ლოგო</TableHead>
            <TableHead>სახელი</TableHead>
            <TableHead className="w-12 text-right">მოქმ.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {restaurants.map((restaurant) => {
            const expanded = expandedIds.has(restaurant.id);

            return (
              <Fragment key={restaurant.id}>
                <TableRow
                  data-state={
                    selectedIds.has(restaurant.id) ? "selected" : undefined
                  }
                >
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpanded(restaurant.id)}
                      aria-expanded={expanded}
                      aria-label={
                        expanded ? "დეტალების დამალვა" : "დეტალების ჩვენება"
                      }
                    >
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform",
                          expanded && "rotate-180",
                        )}
                      />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Avatar
                      src={restaurant.logo}
                      alt={restaurant.name}
                      fallback={restaurant.name}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="text-left font-medium text-neutral-900 hover:text-primary hover:underline"
                      onClick={() =>
                        router.push(`/admin/restaurants/${restaurant.id}`)
                      }
                    >
                      {restaurant.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <RestaurantActions
                      restaurant={restaurant}
                      onApprove={onApprove}
                      onReject={onReject}
                      onSuspend={onSuspend}
                      onUnsuspend={onUnsuspend}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
                {expanded && (
                  <TableRow className="bg-neutral-50/80 hover:bg-neutral-50/80">
                    <TableCell colSpan={4} className="p-4">
                      <RestaurantDetails
                        restaurant={restaurant}
                        selected={selectedIds.has(restaurant.id)}
                        onToggleSelect={(checked) =>
                          toggleOne(restaurant.id, checked)
                        }
                        onViewDetails={() =>
                          router.push(`/admin/restaurants/${restaurant.id}`)
                        }
                      />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

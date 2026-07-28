"use client";

import { useRouter } from "next/navigation";
import {
  Ban,
  Check,
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
import type { AdminRestaurant } from "./types";
import { APPROVAL_BADGE, APPROVAL_LABELS } from "./types";
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
  onDelete: (r: AdminRestaurant) => void;
};

export default function RestaurantsTable({
  restaurants,
  selectedIds,
  onSelectionChange,
  onApprove,
  onReject,
  onSuspend,
  onDelete,
}: RestaurantsTableProps) {
  const router = useRouter();
  const allSelected =
    restaurants.length > 0 &&
    restaurants.every((r) => selectedIds.has(r.id));

  function toggleAll(checked: boolean) {
    if (checked) {
      onSelectionChange(new Set(restaurants.map((r) => r.id)));
    } else {
      onSelectionChange(new Set());
    }
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
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(c) => toggleAll(c === true)}
                aria-label="ყველას არჩევა"
              />
            </TableHead>
            <TableHead className="w-12">ლოგო</TableHead>
            <TableHead className="min-w-[140px]">სახელი</TableHead>
            <TableHead className="hidden lg:table-cell">მფლობელი</TableHead>
            <TableHead className="hidden xl:table-cell">კატეგორია</TableHead>
            <TableHead className="hidden md:table-cell">ქალაქი</TableHead>
            <TableHead className="hidden lg:table-cell">ტელ.</TableHead>
            <TableHead className="hidden sm:table-cell">რეიტ.</TableHead>
            <TableHead className="hidden xl:table-cell">მიწ.</TableHead>
            <TableHead className="hidden xl:table-cell">მინ.</TableHead>
            <TableHead>სტატ.</TableHead>
            <TableHead className="hidden md:table-cell">დამტ.</TableHead>
            <TableHead className="hidden lg:table-cell">პრ.</TableHead>
            <TableHead className="hidden lg:table-cell">შეკ.</TableHead>
            <TableHead className="hidden xl:table-cell">შექმ.</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {restaurants.map((restaurant) => (
            <TableRow
              key={restaurant.id}
              data-state={selectedIds.has(restaurant.id) ? "selected" : undefined}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(restaurant.id)}
                  onCheckedChange={(c) =>
                    toggleOne(restaurant.id, c === true)
                  }
                  aria-label={`${restaurant.name} არჩევა`}
                />
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
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {ownerFullName(restaurant)}
              </TableCell>
              <TableCell className="hidden xl:table-cell max-w-[120px] truncate text-muted-foreground">
                {categoriesLabel(restaurant.categories)}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {restaurant.city}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                {restaurant.phone}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {restaurant.rating > 0 ? (
                  <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {formatGel(restaurant.deliveryFee)}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {formatGel(restaurant.minimumOrder)}
              </TableCell>
              <TableCell>
                <Badge variant={openStatusVariant(restaurant)}>
                  {openStatusLabel(restaurant)}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={APPROVAL_BADGE[restaurant.approvalStatus]}>
                  {APPROVAL_LABELS[restaurant.approvalStatus]}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell tabular-nums">
                {restaurant.totalProducts}
              </TableCell>
              <TableCell className="hidden lg:table-cell tabular-nums">
                {restaurant.totalOrders}
              </TableCell>
              <TableCell className="hidden xl:table-cell text-muted-foreground">
                {formatDateTime(restaurant.createdAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/admin/restaurants/${restaurant.id}`)
                      }
                    >
                      <Eye className="size-4" />
                      დეტალები
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(
                          `/admin/restaurants/${restaurant.id}?tab=general`,
                        )
                      }
                    >
                      <Pencil className="size-4" />
                      რედაქტირება
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/admin/products")}
                    >
                      <Package className="size-4" />
                      პროდუქტები
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(
                          `/admin/restaurants/${restaurant.id}?tab=categories`,
                        )
                      }
                    >
                      <FolderTree className="size-4" />
                      კატეგორიები
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(
                          `/admin/restaurants/${restaurant.id}?tab=orders`,
                        )
                      }
                    >
                      <ShoppingBag className="size-4" />
                      შეკვეთები
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(
                          `/admin/restaurants/${restaurant.id}?tab=hours`,
                        )
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
                    {!restaurant.isSuspended && (
                      <DropdownMenuItem onClick={() => onSuspend(restaurant)}>
                        <Ban className="size-4" />
                        შეჩერება
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

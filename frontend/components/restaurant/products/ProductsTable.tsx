"use client";

import {
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatMinutes } from "@/lib/restaurant/format";
import { KA, PRODUCT_AVAILABILITY_LABELS } from "@/lib/restaurant/labels";
import type { RestaurantProduct } from "@/lib/restaurant/types";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  UNAVAILABLE: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  HIDDEN: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  OUT_OF_STOCK: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

type ProductsTableProps = {
  products: RestaurantProduct[];
  onEdit: (product: RestaurantProduct) => void;
  onDuplicate: (product: RestaurantProduct) => void;
  onDelete: (product: RestaurantProduct) => void;
};

export default function ProductsTable({
  products,
  onEdit,
  onDuplicate,
  onDelete,
}: ProductsTableProps) {
  return (
    <div className="rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">{KA.image}</TableHead>
            <TableHead>{KA.products.name}</TableHead>
            <TableHead>{KA.products.category}</TableHead>
            <TableHead>{KA.products.price}</TableHead>
            <TableHead>{KA.products.discountPrice}</TableHead>
            <TableHead>{KA.products.prepTime}</TableHead>
            <TableHead>{KA.status}</TableHead>
            <TableHead className="text-right">{KA.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="size-10 overflow-hidden rounded-lg bg-muted">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium">{product.name}</p>
              </TableCell>
              <TableCell>{product.categoryName}</TableCell>
              <TableCell>{formatCurrency(product.price)}</TableCell>
              <TableCell>
                {product.discountPrice != null ? (
                  <span className="font-medium text-primary">
                    {formatCurrency(product.discountPrice)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {product.preparationTime != null
                  ? formatMinutes(product.preparationTime)
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn(
                    "font-medium",
                    STATUS_COLORS[product.availability],
                  )}
                >
                  {PRODUCT_AVAILABILITY_LABELS[product.availability]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(product)}>
                      <Pencil className="size-4" />
                      {KA.edit}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(product)}>
                      <Copy className="size-4" />
                      {KA.duplicate}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(product)}
                    >
                      <Trash2 className="size-4" />
                      {KA.delete}
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

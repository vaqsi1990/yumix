"use client";

import Image from "next/image";
import {
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { AdminCategory, AdminProduct, AdminRestaurant } from "./types";
import {
  AVAILABILITY_BADGE,
  AVAILABILITY_LABELS,
} from "./types";
import {
  getCategoryName,
  getRestaurantName,
} from "./helpers";

type ProductsTableProps = {
  products: AdminProduct[];
  restaurants: AdminRestaurant[];
  categories: AdminCategory[];
  onView: (product: AdminProduct) => void;
  onEdit: (product: AdminProduct) => void;
  onDuplicate: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
  onToggleAvailability: (product: AdminProduct) => void;
};

export default function ProductsTable({
  products,
  restaurants,
  categories,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleAvailability,
}: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
        პროდუქტები ვერ მოიძებნა
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">სურათი</TableHead>
            <TableHead>სახელი</TableHead>
            <TableHead className="hidden md:table-cell">რესტორანი</TableHead>
            <TableHead className="hidden lg:table-cell">კატეგორია</TableHead>
            <TableHead>ფასი</TableHead>
            <TableHead className="hidden sm:table-cell">ფასდ.</TableHead>
            <TableHead>სტატუსი</TableHead>
            <TableHead className="hidden xl:table-cell">მომზ.</TableHead>
            <TableHead className="hidden xl:table-cell">შექმნა</TableHead>
            <TableHead className="w-12 text-right">მოქ.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="relative size-10 overflow-hidden rounded-lg bg-muted">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-[16px] md:text-[18px] text-muted-foreground">
                      —
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="min-w-[120px]">
                  <p className="font-medium text-neutral-900">{product.name}</p>
                  {product.description && (
                    <p className="mt-0.5 line-clamp-1 text-[16px] md:text-[18px] text-muted-foreground">
                      {product.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {getRestaurantName(product.restaurantId, restaurants)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {getCategoryName(product.categoryId, categories)}
              </TableCell>
              <TableCell>{formatGel(product.price)}</TableCell>
              <TableCell className="hidden sm:table-cell">
                {product.discountPrice != null
                  ? formatGel(product.discountPrice)
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge variant={AVAILABILITY_BADGE[product.availability]}>
                  {AVAILABILITY_LABELS[product.availability]}
                </Badge>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {product.preparationTime != null
                  ? `${product.preparationTime} წთ`
                  : "—"}
              </TableCell>
              <TableCell className="hidden xl:table-cell text-muted-foreground">
                {formatDateTime(product.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">მოქმედებები</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(product)}>
                      <Eye className="size-4" />
                      ნახვა
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(product)}>
                      <Pencil className="size-4" />
                      რედაქტირება
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(product)}>
                      <Copy className="size-4" />
                      დუბლირება
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleAvailability(product)}
                    >
                      <Power className="size-4" />
                      {product.availability === "AVAILABLE"
                        ? "გათიშვა"
                        : "ჩართვა"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(product)}
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

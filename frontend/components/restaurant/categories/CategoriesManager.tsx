"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/restaurant/PageHeader";
import CategoryDialog from "@/components/restaurant/categories/CategoryDialog";
import ConfirmDialog from "@/components/restaurant/ConfirmDialog";
import EmptyState from "@/components/restaurant/EmptyState";
import TableSkeleton from "@/components/restaurant/skeletons/TableSkeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { restaurantApi } from "@/lib/restaurant/api";
import { KA, translateApiError } from "@/lib/restaurant/labels";
import type { ProductCategory } from "@/lib/restaurant/types";

export default function CategoriesManager() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(
    null,
  );

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await restaurantApi.categories();
      setCategories(
        [...res.categories].sort((a, b) => a.sortOrder - b.sortOrder),
      );
    } catch (e) {
      setError(
        translateApiError(e instanceof Error ? e.message : KA.failedLoad),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function handleSave(data: { name: string; sortOrder: number }) {
    try {
      if (editing) {
        await restaurantApi.updateCategory(editing.id, data);
      } else {
        await restaurantApi.createCategory(data);
      }
      await loadCategories();
      setEditing(null);
    } catch (e) {
      alert(
        translateApiError(e instanceof Error ? e.message : KA.failedSave),
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await restaurantApi.deleteCategory(deleteTarget.id);
      await loadCategories();
      setDeleteTarget(null);
    } catch (e) {
      alert(
        translateApiError(e instanceof Error ? e.message : KA.failedDelete),
      );
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={KA.categories.title} description={KA.loading} />
        <TableSkeleton rows={5} cols={5} />
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
        title={KA.categories.title}
        description={KA.categories.subtitle}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            {KA.categories.create}
          </Button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={KA.categories.empty}
          description={KA.categories.emptyDesc}
          actionLabel={KA.categories.create}
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{KA.products.name}</TableHead>
                <TableHead>{KA.menu.productsCount}</TableHead>
                <TableHead>{KA.categories.sortOrder}</TableHead>
                <TableHead className="text-right">{KA.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category._count.products}</TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(category);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                          {KA.edit}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(category)}
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
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={KA.categories.deleteTitle}
        description={
          deleteTarget
            ? KA.categories.deleteDesc.replace("{name}", deleteTarget.name)
            : ""
        }
        confirmLabel={KA.delete}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

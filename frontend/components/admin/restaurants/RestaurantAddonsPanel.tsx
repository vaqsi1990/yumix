"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseApiError } from "@/lib/admin/api";
import { formatGel } from "@/lib/admin/format";
import {
  ADDON_CATEGORY_LABELS,
  type AddonCategory,
} from "@/lib/addon-categories";

type ProductAddon = {
  id: string;
  name: string;
  price: number;
  category?: AddonCategory;
};

type RestaurantAddonsPanelProps = {
  restaurantId: string;
  api?: {
    list: string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
  };
};

const defaultAddonApi = (restaurantId: string) => ({
  list: `/api/backend/admin/restaurants/${restaurantId}/addons`,
  create: `/api/backend/admin/restaurants/${restaurantId}/addons`,
  update: (id: string) => `/api/backend/admin/addons/${id}`,
  delete: (id: string) => `/api/backend/admin/addons/${id}`,
});

export default function RestaurantAddonsPanel({
  restaurantId,
  api,
}: RestaurantAddonsPanelProps) {
  const endpoints = api ?? defaultAddonApi(restaurantId);
  const [addOns, setAddOns] = useState<ProductAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState<AddonCategory>("FOOD");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState<AddonCategory>("FOOD");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAddons = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(endpoints.list);
      if (!res.ok) {
        throw new Error(await parseApiError(res, "დამატებების ჩატვირთვა ვერ მოხერხდა"));
      }
      const data = (await res.json()) as { addOns: ProductAddon[] };
      setAddOns(data.addOns);
    } catch (e) {
      setError(e instanceof Error ? e.message : "დამატებების ჩატვირთვა ვერ მოხერხდა");
      setAddOns([]);
    } finally {
      setLoading(false);
    }
  }, [endpoints.list]);

  useEffect(() => {
    void loadAddons();
  }, [loadAddons]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    const price = Number(newPrice);
    if (!name || !Number.isFinite(price) || price < 0) return;

    setCreating(true);
    setError("");
    try {
      const res = await fetch(endpoints.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, category: newCategory }),
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res, "დამატების შექმნა ვერ მოხერხდა"));
      }
      setNewName("");
      setNewPrice("");
      setNewCategory("FOOD");
      await loadAddons();
    } catch (e) {
      setError(e instanceof Error ? e.message : "დამატების შექმნა ვერ მოხერხდა");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(addon: ProductAddon) {
    setEditingId(addon.id);
    setEditName(addon.name);
    setEditPrice(String(addon.price));
    setEditCategory(addon.category ?? "FOOD");
  }

  async function saveEdit(id: string) {
    const name = editName.trim();
    const price = Number(editPrice);
    if (!name || !Number.isFinite(price) || price < 0) return;

    setSavingId(id);
    setError("");
    try {
      const res = await fetch(endpoints.update(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, category: editCategory }),
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res, "შენახვა ვერ მოხერხდა"));
      }
      setEditingId(null);
      await loadAddons();
    } catch (e) {
      setError(e instanceof Error ? e.message : "შენახვა ვერ მოხერხდა");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("დარწმუნებული ხარ, რომ გსურს ამ დამატების წაშლა?")) return;

    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(endpoints.delete(id), {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res, "წაშლა ვერ მოხერხდა"));
      }
      await loadAddons();
    } catch (e) {
      setError(e instanceof Error ? e.message : "წაშლა ვერ მოხერხდა");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="border-neutral-200">
      <CardHeader>
        <CardTitle className="text-base">დამატებები (add-ons)</CardTitle>
        <p className="text-sm text-muted-foreground">
          დაამატე სასმელები (+ სასმელები) და დამატებითი კერძები (+ კერძები), რომ
          მომხმარებელმა შეკვეთისას აირჩიოს.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">სახელი</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="მაგ. ყველი, სოუსი..."
              required
            />
          </div>
          <div className="w-full space-y-1 sm:w-36">
            <label className="text-sm font-medium">ტიპი</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as AddonCategory)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="FOOD">{ADDON_CATEGORY_LABELS.FOOD}</option>
              <option value="DRINK">{ADDON_CATEGORY_LABELS.DRINK}</option>
            </select>
          </div>
          <div className="w-full space-y-1 sm:w-32">
            <label className="text-sm font-medium">ფასი (₾)</label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <Button type="submit" disabled={creating} className="sm:mb-0.5">
            <Plus className="size-4" />
            დამატება
          </Button>
        </form>

        {loading ? (
          <p className="py-8 text-center text-muted-foreground">იტვირთება...</p>
        ) : addOns.length === 0 ? (
          <p className="rounded-xl bg-muted/50 py-8 text-center text-sm text-muted-foreground">
            დამატებები ჯერ არ არის
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>სახელი</TableHead>
                <TableHead>ტიპი</TableHead>
                <TableHead>ფასი</TableHead>
                <TableHead className="text-right">მოქმედება</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addOns.map((addon) => (
                <TableRow key={addon.id}>
                  <TableCell>
                    {editingId === addon.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8"
                      />
                    ) : (
                      addon.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === addon.id ? (
                      <select
                        value={editCategory}
                        onChange={(e) =>
                          setEditCategory(e.target.value as AddonCategory)
                        }
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                      >
                        <option value="FOOD">{ADDON_CATEGORY_LABELS.FOOD}</option>
                        <option value="DRINK">{ADDON_CATEGORY_LABELS.DRINK}</option>
                      </select>
                    ) : (
                      ADDON_CATEGORY_LABELS[addon.category ?? "FOOD"]
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === addon.id ? (
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="h-8 w-24"
                      />
                    ) : (
                      formatGel(addon.price)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === addon.id ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          გაუქმება
                        </Button>
                        <Button
                          size="sm"
                          disabled={savingId === addon.id}
                          onClick={() => void saveEdit(addon.id)}
                        >
                          შენახვა
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEdit(addon)}
                          aria-label="რედაქტირება"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          disabled={deletingId === addon.id}
                          onClick={() => void handleDelete(addon.id)}
                          aria-label="წაშლა"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

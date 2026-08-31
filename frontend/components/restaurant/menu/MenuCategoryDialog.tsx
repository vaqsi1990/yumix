"use client";

import { useState } from "react";
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
import { KA } from "@/lib/restaurant/labels";
import type { MenuCategory } from "@/lib/restaurant/types";

type MenuCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: MenuCategory | null;
  onSave: (data: {
    name: string;
    description?: string;
    image?: string;
    visible: boolean;
    sortOrder: number;
  }) => void;
};

export default function MenuCategoryDialog({
  open,
  onOpenChange,
  category,
  onSave,
}: MenuCategoryDialogProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [visible, setVisible] = useState(category?.visible ?? true);
  const [sortOrder, setSortOrder] = useState(category?.sortOrder ?? 0);

  function handleOpenChange(next: boolean) {
    if (next) {
      setName(category?.name ?? "");
      setVisible(category?.visible ?? true);
      setSortOrder(category?.sortOrder ?? 0);
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ name, visible, sortOrder });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {category ? KA.menu.editCategory : KA.menu.createCategory}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{KA.products.name}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">{KA.categories.sortOrder}</Label>
              <Input
                id="sortOrder"
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="visible">{KA.visible}</Label>
              <Switch id="visible" checked={visible} onCheckedChange={setVisible} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {KA.cancel}
            </Button>
            <Button type="submit">
              {category ? KA.saveChanges : KA.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

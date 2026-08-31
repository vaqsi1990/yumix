"use client";

import {
  Eye,
  EyeOff,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KA } from "@/lib/restaurant/labels";
import type { MenuCategory } from "@/lib/restaurant/types";

type MenuCategoryCardProps = {
  category: MenuCategory;
  onEdit: (category: MenuCategory) => void;
  onDelete: (category: MenuCategory) => void;
  onToggleVisibility: (category: MenuCategory) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  isDragging: boolean;
};

export default function MenuCategoryCard({
  category,
  onEdit,
  onDelete,
  onToggleVisibility,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: MenuCategoryCardProps) {
  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, category.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, category.id)}
      className={`group overflow-hidden transition-opacity ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {category.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.image}
            alt={category.name}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            {KA.noImage}
          </div>
        )}
        <div className="absolute left-2 top-2 cursor-grab rounded-md bg-background/80 p-1 backdrop-blur active:cursor-grabbing">
          <GripVertical className="size-4 text-muted-foreground" />
        </div>
        {!category.visible && (
          <Badge
            variant="secondary"
            className="absolute right-2 top-2 bg-background/80 backdrop-blur"
          >
            {KA.hidden}
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{category.name}</h3>
            {category.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {category.description}
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {category.productsCount} {KA.menu.productsCount}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Pencil className="size-4" />
                {KA.edit}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleVisibility(category)}>
                {category.visible ? (
                  <>
                    <EyeOff className="size-4" />
                    {KA.menu.hide}
                  </>
                ) : (
                  <>
                    <Eye className="size-4" />
                    {KA.menu.show}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(category)}
              >
                <Trash2 className="size-4" />
                {KA.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

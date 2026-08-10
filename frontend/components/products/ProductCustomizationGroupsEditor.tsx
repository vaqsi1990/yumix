"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ProductCustomizationGroup } from "@/components/admin/products/types";

type ProductCustomizationGroupsEditorProps = {
  value: ProductCustomizationGroup[];
  onChange: (groups: ProductCustomizationGroup[]) => void;
};

function emptyGroup(sortOrder: number): ProductCustomizationGroup {
  return {
    name: "",
    description: "",
    required: false,
    minSelections: 0,
    maxSelections: 1,
    sortOrder,
    options: [{ name: "", price: 0, sortOrder: 0, isAvailable: true }],
  };
}

export default function ProductCustomizationGroupsEditor({
  value,
  onChange,
}: ProductCustomizationGroupsEditorProps) {
  function updateGroup(index: number, patch: Partial<ProductCustomizationGroup>) {
    const next = value.map((group, i) =>
      i === index ? { ...group, ...patch } : group,
    );
    onChange(next);
  }

  function removeGroup(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addGroup() {
    onChange([...value, emptyGroup(value.length)]);
  }

  function updateOption(
    groupIndex: number,
    optionIndex: number,
    patch: Partial<ProductCustomizationGroup["options"][number]>,
  ) {
    const group = value[groupIndex];
    const options = group.options.map((option, i) =>
      i === optionIndex ? { ...option, ...patch } : option,
    );
    updateGroup(groupIndex, { options });
  }

  function addOption(groupIndex: number) {
    const group = value[groupIndex];
    updateGroup(groupIndex, {
      options: [
        ...group.options,
        {
          name: "",
          price: 0,
          sortOrder: group.options.length,
          isAvailable: true,
        },
      ],
    });
  }

  function removeOption(groupIndex: number, optionIndex: number) {
    const group = value[groupIndex];
    if (group.options.length <= 1) return;
    updateGroup(groupIndex, {
      options: group.options.filter((_, i) => i !== optionIndex),
    });
  }

  return (
    <div className="space-y-4">
      {value.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="space-y-4 rounded-xl border border-neutral-200 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>ჯგუფის სახელი</Label>
                <Input
                  value={group.name}
                  placeholder="მაგ. სოუსი, დამატებითი, სასმელი"
                  onChange={(e) =>
                    updateGroup(groupIndex, { name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>აღწერა (არასავალდებულო)</Label>
                <Textarea
                  value={group.description ?? ""}
                  rows={2}
                  onChange={(e) =>
                    updateGroup(groupIndex, { description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>მინ. არჩევანი</Label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={group.minSelections ?? 0}
                  onChange={(e) =>
                    updateGroup(groupIndex, {
                      minSelections: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>მაქს. არჩევანი</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={group.maxSelections ?? 1}
                  onChange={(e) =>
                    updateGroup(groupIndex, {
                      maxSelections: Number(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-red-500"
              onClick={() => removeGroup(groupIndex)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
            <Label htmlFor={`required-${groupIndex}`}>სავალდებულო ჯგუფი</Label>
            <Switch
              id={`required-${groupIndex}`}
              checked={group.required}
              onCheckedChange={(checked) =>
                updateGroup(groupIndex, {
                  required: checked,
                  minSelections: checked
                    ? Math.max(1, group.minSelections ?? 0)
                    : group.minSelections ?? 0,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>ვარიანტები</Label>
            {group.options.map((option, optionIndex) => (
              <div
                key={optionIndex}
                className="grid items-center gap-2 sm:grid-cols-[1fr_120px_auto]"
              >
                <Input
                  value={option.name}
                  placeholder="სახელი"
                  onChange={(e) =>
                    updateOption(groupIndex, optionIndex, {
                      name: e.target.value,
                    })
                  }
                />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={option.price}
                  placeholder="₾"
                  onChange={(e) =>
                    updateOption(groupIndex, optionIndex, {
                      price: Number(e.target.value) || 0,
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={group.options.length <= 1}
                  onClick={() => removeOption(groupIndex, optionIndex)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addOption(groupIndex)}
            >
              <Plus className="mr-1 size-4" />
              ვარიანტის დამატება
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addGroup}>
        <Plus className="mr-1 size-4" />
        კასტომიზაციის ჯგუფის დამატება
      </Button>
    </div>
  );
}

"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ProductCustomizationGroup } from "@/components/admin/products/types";
import { cn } from "@/lib/utils";

type ProductCustomizationGroupsEditorProps = {
  value: ProductCustomizationGroup[];
  onChange: (groups: ProductCustomizationGroup[]) => void;
  numberInputClass?: string;
};

const OPTION_TEMPLATES: {
  name: string;
  description: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: { name: string; price: number }[];
}[] = [
  {
    name: "სოუსი",
    description: "აირჩიე სოუსი",
    required: true,
    minSelections: 1,
    maxSelections: 1,
    options: [
      { name: "კეტჩუპი", price: 0 },
      { name: "მაიონეზი", price: 0 },
      { name: "მდოგვი", price: 0 },
    ],
  },
  {
    name: "ცხარობა",
    description: "აირჩიე ცხარობის დონე",
    required: true,
    minSelections: 1,
    maxSelections: 1,
    options: [
      { name: "არაცხარე", price: 0 },
      { name: "საშუალო", price: 0 },
      { name: "ცხარე", price: 0 },
    ],
  },
  {
    name: "დამატებითი",
    description: "სურვილისამებრ დაამატე",
    required: false,
    minSelections: 0,
    maxSelections: 5,
    options: [
      { name: "ყველი", price: 2 },
      { name: "ბეკონი", price: 3 },
    ],
  },
];

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

function fromTemplate(
  template: (typeof OPTION_TEMPLATES)[number],
  sortOrder: number,
): ProductCustomizationGroup {
  return {
    name: template.name,
    description: template.description,
    required: template.required,
    minSelections: template.minSelections,
    maxSelections: template.maxSelections,
    sortOrder,
    options: template.options.map((option, index) => ({
      name: option.name,
      price: option.price,
      sortOrder: index,
      isAvailable: true,
    })),
  };
}

export default function ProductCustomizationGroupsEditor({
  value,
  onChange,
  numberInputClass,
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

  function addGroup(group?: ProductCustomizationGroup) {
    onChange([...value, group ?? emptyGroup(value.length)]);
  }

  function addTemplate(template: (typeof OPTION_TEMPLATES)[number]) {
    if (value.some((group) => group.name === template.name)) return;
    addGroup(fromTemplate(template, value.length));
  }

  function setSelectionType(index: number, multiple: boolean) {
    const group = value[index];
    if (multiple) {
      updateGroup(index, {
        maxSelections: Math.max(2, group.maxSelections ?? 2, group.options.length),
        minSelections: group.required ? Math.max(1, group.minSelections ?? 1) : 0,
      });
      return;
    }
    updateGroup(index, {
      maxSelections: 1,
      minSelections: group.required ? 1 : 0,
    });
  }

  function setRequired(index: number, required: boolean) {
    const group = value[index];
    const maxSelections = Math.max(1, group.maxSelections ?? 1);
    updateGroup(index, {
      required,
      minSelections: required ? Math.max(1, group.minSelections ?? 1) : 0,
      maxSelections: required ? Math.max(1, maxSelections) : maxSelections,
    });
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

  const usedTemplateNames = new Set(value.map((group) => group.name));

  return (
    <div className="space-y-4">
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          დაამატე ოფციები, რომ მომხმარებელმა შეკვეთისას აირჩიოს სოუსი, ცხარობა
          ან დამატებითი.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {OPTION_TEMPLATES.map((template) => (
          <Button
            key={template.name}
            type="button"
            variant="outline"
            size="sm"
            disabled={usedTemplateNames.has(template.name)}
            onClick={() => addTemplate(template)}
          >
            <Plus className="mr-1 size-4" />
            {template.name}
          </Button>
        ))}
      </div>

      {value.map((group, groupIndex) => {
        const isMultiple = (group.maxSelections ?? 1) > 1;

        return (
          <div
            key={group.id ?? groupIndex}
            className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="grid flex-1 gap-3">
                <div className="space-y-2">
                  <Label>ჯგუფის სახელი</Label>
                  <Input
                    value={group.name}
                    placeholder="მაგ. სოუსი, დამატებითი, სასმელი"
                    onChange={(e) =>
                      updateGroup(groupIndex, { name: e.target.value })
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

            <div className="space-y-2">
              <Label>არჩევის ტიპი</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectionType(groupIndex, false)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm transition",
                    !isMultiple
                      ? "border-[#FF0050] bg-[#FF0050]/5 font-medium"
                      : "border-neutral-200 hover:border-neutral-300",
                  )}
                >
                  ერთი არჩევანი
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    რადიო — მაგ. სოუსი
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionType(groupIndex, true)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm transition",
                    isMultiple
                      ? "border-[#FF0050] bg-[#FF0050]/5 font-medium"
                      : "border-neutral-200 hover:border-neutral-300",
                  )}
                >
                  რამდენიმე არჩევანი
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    ჩექბოქსი — მაგ. დამატებითი
                  </span>
                </button>
              </div>
            </div>

            {isMultiple ? (
              <div className="space-y-2">
                <Label htmlFor={`max-${groupIndex}`}>მაქს. არჩევანი</Label>
                <Input
                  id={`max-${groupIndex}`}
                  type="number"
                  min={Math.max(1, group.minSelections ?? 1)}
                  max={20}
                  value={group.maxSelections ?? 2}
                  onChange={(e) =>
                    updateGroup(groupIndex, {
                      maxSelections: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className={numberInputClass}
                />
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
              <div>
                <Label htmlFor={`required-${groupIndex}`}>სავალდებულო</Label>
                <p className="text-xs text-muted-foreground">
                  მომხმარებელმა აუცილებლად უნდა აირჩიოს
                </p>
              </div>
              <Switch
                id={`required-${groupIndex}`}
                checked={Boolean(group.required)}
                onCheckedChange={(checked) =>
                  setRequired(groupIndex, checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>ვარიანტები</Label>
              {group.options.map((option, optionIndex) => (
                <div
                  key={option.id ?? optionIndex}
                  className="grid items-center gap-2 sm:grid-cols-[1fr_110px_auto]"
                >
                  <Input
                    value={option.name}
                    placeholder="ვარიანტის სახელი"
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
                    value={option.price || ""}
                    placeholder="+₾"
                    onChange={(e) =>
                      updateOption(groupIndex, optionIndex, {
                        price: Number(e.target.value.replace(",", ".")) || 0,
                      })
                    }
                    className={numberInputClass}
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
        );
      })}

      <Button type="button" variant="outline" onClick={() => addGroup()}>
        <Plus className="mr-1 size-4" />
        ოფციების ჯგუფის დამატება
      </Button>
    </div>
  );
}

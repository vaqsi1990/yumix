"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ProductCustomizationGroup } from "@/components/admin/products/types";
import {
  EXCLUSION_GROUP_NAME,
  isExclusionGroup,
  normalizeCustomizationGroupKind,
} from "@/lib/customization-groups";

type ProductCustomizationGroupsEditorProps = {
  value: ProductCustomizationGroup[];
  onChange: (groups: ProductCustomizationGroup[]) => void;
  numberInputClass?: string;
};

function emptyOptionGroup(sortOrder: number): ProductCustomizationGroup {
  return {
    kind: "option",
    name: "",
    description: "",
    required: false,
    minSelections: 0,
    maxSelections: 1,
    sortOrder,
    options: [],
  };
}

function emptyExclusionGroup(sortOrder: number): ProductCustomizationGroup {
  return {
    kind: "exclusion",
    name: EXCLUSION_GROUP_NAME,
    description: "",
    required: false,
    minSelections: 0,
    maxSelections: 20,
    sortOrder,
    options: [],
  };
}

function parseVariantsList(
  text: string,
  allowPrices: boolean,
): ProductCustomizationGroup["options"] {
  const parts = text
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return [];

  return parts.map((part, index) => {
    if (allowPrices) {
      const priceMatch = part.match(/^(.+?)\s*\+\s*(\d+(?:[.,]\d+)?)\s*₾?$/);
      if (priceMatch) {
        return {
          name: priceMatch[1].trim(),
          price: Number(priceMatch[2].replace(",", ".")) || 0,
          sortOrder: index,
          isAvailable: true,
        };
      }
    }

    return {
      name: part,
      price: 0,
      sortOrder: index,
      isAvailable: true,
    };
  });
}

function formatVariantsList(
  options: ProductCustomizationGroup["options"],
  allowPrices: boolean,
): string {
  return options
    .map((option) => {
      const name = option.name.trim();
      if (!name) return "";
      if (allowPrices && option.price > 0) {
        return `${name} +${option.price}`;
      }
      return name;
    })
    .filter(Boolean)
    .join(", ");
}

function syncOptionGroup(
  group: ProductCustomizationGroup,
): ProductCustomizationGroup {
  const namedOptions = group.options.filter((option) => option.name.trim());
  const isMultiple = (group.maxSelections ?? 1) > 1;
  const required = Boolean(group.required);

  return {
    ...group,
    kind: "option",
    options: namedOptions,
    minSelections: required ? 1 : 0,
    maxSelections: isMultiple
      ? Math.min(20, Math.max(2, namedOptions.length || 2))
      : 1,
  };
}

function syncExclusionGroup(
  group: ProductCustomizationGroup,
): ProductCustomizationGroup {
  const namedOptions = group.options
    .filter((option) => option.name.trim())
    .map((option) => ({
      ...option,
      price: 0,
    }));

  return {
    ...group,
    kind: "exclusion",
    name: EXCLUSION_GROUP_NAME,
    required: false,
    minSelections: 0,
    maxSelections: Math.min(20, Math.max(2, namedOptions.length || 2)),
    options: namedOptions,
  };
}

function VariantListInput({
  groupKey,
  options,
  allowPrices,
  placeholder,
  onChange,
}: {
  groupKey: string;
  options: ProductCustomizationGroup["options"];
  allowPrices: boolean;
  placeholder: string;
  onChange: (options: ProductCustomizationGroup["options"]) => void;
}) {
  const [text, setText] = useState(() =>
    formatVariantsList(options, allowPrices),
  );

  useEffect(() => {
    setText(formatVariantsList(options, allowPrices));
  }, [groupKey, allowPrices]);

  return (
    <Input
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        const nextText = e.target.value;
        setText(nextText);
        onChange(parseVariantsList(nextText, allowPrices));
      }}
    />
  );
}

function splitGroups(value: ProductCustomizationGroup[]) {
  const optionGroups = value.filter((group) => !isExclusionGroup(group));
  const exclusionGroup =
    value.find((group) => isExclusionGroup(group)) ?? null;

  return { optionGroups, exclusionGroup };
}

function mergeGroups(
  optionGroups: ProductCustomizationGroup[],
  exclusionGroup: ProductCustomizationGroup | null,
) {
  const next = optionGroups.map((group, index) =>
    syncOptionGroup({
      ...group,
      kind: "option",
      sortOrder: index,
    }),
  );

  if (
    exclusionGroup &&
    exclusionGroup.options.some((option) => option.name.trim())
  ) {
    next.push(
      syncExclusionGroup({
        ...exclusionGroup,
        sortOrder: next.length,
      }),
    );
  }

  return next;
}

export default function ProductCustomizationGroupsEditor({
  value,
  onChange,
}: ProductCustomizationGroupsEditorProps) {
  const { optionGroups, exclusionGroup } = splitGroups(value);

  function commit(
    nextOptions: ProductCustomizationGroup[],
    nextExclusion: ProductCustomizationGroup | null,
  ) {
    onChange(mergeGroups(nextOptions, nextExclusion));
  }

  function updateOptionGroup(
    index: number,
    patch: Partial<ProductCustomizationGroup>,
  ) {
    const next = optionGroups.map((group, i) =>
      i === index ? syncOptionGroup({ ...group, ...patch }) : group,
    );
    commit(next, exclusionGroup);
  }

  function removeOptionGroup(index: number) {
    commit(
      optionGroups.filter((_, i) => i !== index),
      exclusionGroup,
    );
  }

  function addOptionGroup() {
    commit([...optionGroups, emptyOptionGroup(optionGroups.length)], exclusionGroup);
  }

  function setMultiple(index: number, multiple: boolean) {
    const group = optionGroups[index];
    const namedCount = group.options.filter((option) =>
      option.name.trim(),
    ).length;

    updateOptionGroup(index, {
      maxSelections: multiple
        ? Math.min(20, Math.max(2, namedCount || 2))
        : 1,
      minSelections: group.required ? 1 : 0,
    });
  }

  function setRequired(index: number, required: boolean) {
    updateOptionGroup(index, {
      required,
      minSelections: required ? 1 : 0,
    });
  }

  function updateExclusionGroup(
    patch: Partial<ProductCustomizationGroup>,
  ) {
    const base = exclusionGroup ?? emptyExclusionGroup(optionGroups.length);
    commit(optionGroups, syncExclusionGroup({ ...base, ...patch }));
  }

  function removeExclusionGroup() {
    commit(optionGroups, null);
  }

  function addExclusionGroup() {
    commit(optionGroups, emptyExclusionGroup(optionGroups.length));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">ოფციები</p>
          <p className="text-sm text-muted-foreground">
            სოუსი, დამატებითი, ზომა და სხვა არჩევანი.
          </p>
        </div>

        {optionGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ოფციები ჯერ არ არის დამატებული.
          </p>
        ) : null}

        {optionGroups.map((group, groupIndex) => {
          const groupKey = group.id ?? `option-${groupIndex}`;
          const isMultiple = (group.maxSelections ?? 1) > 1;

          return (
            <div
              key={groupKey}
              className="space-y-3 rounded-xl border border-neutral-200 bg-white p-3"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={group.name}
                  placeholder="ოფციის სახელი (მაგ. სოუსი, დამატებითი)"
                  onChange={(e) =>
                    updateOptionGroup(groupIndex, { name: e.target.value })
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-red-500"
                  onClick={() => removeOptionGroup(groupIndex)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  ვარიანტები (მძიმით)
                </Label>
                <VariantListInput
                  groupKey={groupKey}
                  options={group.options}
                  allowPrices
                  placeholder="მაგ. კეტჩუპი, მაიონეზი, ყველი +2"
                  onChange={(options) =>
                    updateOptionGroup(groupIndex, { options })
                  }
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`required-${groupIndex}`}
                    checked={Boolean(group.required)}
                    onCheckedChange={(checked) =>
                      setRequired(groupIndex, checked)
                    }
                  />
                  <Label
                    htmlFor={`required-${groupIndex}`}
                    className="text-sm font-normal"
                  >
                    სავალდებულო
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`multiple-${groupIndex}`}
                    checked={isMultiple}
                    onCheckedChange={(checked) =>
                      setMultiple(groupIndex, checked)
                    }
                  />
                  <Label
                    htmlFor={`multiple-${groupIndex}`}
                    className="text-sm font-normal"
                  >
                    რამდენიმის არჩევა
                  </Label>
                </div>
              </div>
            </div>
          );
        })}

        <Button type="button" variant="outline" onClick={addOptionGroup}>
          <Plus className="mr-1 size-4" />
          ოფციის დამატება
        </Button>
      </div>

      <div className="space-y-3 border-t border-neutral-200 pt-5">
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            {EXCLUSION_GROUP_NAME}
          </p>
          <p className="text-sm text-muted-foreground">
            რა არ უნდა იყოს კერძში — მომხმარებელი აირჩევს სურვილისამებრ.
          </p>
        </div>

        {exclusionGroup ? (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  გამონაკლისები (მძიმით)
                </Label>
                <VariantListInput
                  groupKey={exclusionGroup.id ?? "exclusion"}
                  options={exclusionGroup.options}
                  allowPrices={false}
                  placeholder="მაგ. კეტჩუპის გარეშე, ხახვის გარეშე, სალათის გარეშე"
                  onChange={(options) => updateExclusionGroup({ options })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-red-500"
                onClick={removeExclusionGroup}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={addExclusionGroup}>
            <Plus className="mr-1 size-4" />
            გამონაკლისების დამატება
          </Button>
        )}
      </div>
    </div>
  );
}

export function normalizeCustomizationGroupsForSubmit(
  groups: ProductCustomizationGroup[],
): ProductCustomizationGroup[] {
  return mergeGroups(
    groups.filter((group) => !isExclusionGroup(group)),
    groups.find((group) => isExclusionGroup(group)) ?? null,
  ).map((group, groupIndex) => ({
    ...group,
    kind: normalizeCustomizationGroupKind(group.kind),
    sortOrder: groupIndex,
  }));
}

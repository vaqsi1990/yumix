"use client";

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

const MIN_VARIANT_ROWS = 1;

type OptionRow = ProductCustomizationGroup["options"][number];

function emptyOptionRow(sortOrder: number): OptionRow {
  return {
    name: "",
    price: 0,
    sortOrder,
    isAvailable: true,
  };
}

function emptyOptionRows(count = MIN_VARIANT_ROWS): OptionRow[] {
  return Array.from({ length: count }, (_, index) => emptyOptionRow(index));
}

function emptyOptionGroup(sortOrder: number): ProductCustomizationGroup {
  return {
    kind: "option",
    name: "",
    description: "",
    required: false,
    minSelections: 0,
    maxSelections: 1,
    sortOrder,
    options: emptyOptionRows(),
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
    options: emptyOptionRows(),
  };
}

function ensureMinOptionRows(options: OptionRow[], minRows = MIN_VARIANT_ROWS) {
  const rows = options.length > 0 ? [...options] : [];
  while (rows.length < minRows) {
    rows.push(emptyOptionRow(rows.length));
  }
  return rows.map((row, index) => ({ ...row, sortOrder: index }));
}

function namedOptionCount(options: OptionRow[]) {
  return options.filter((option) => option.name.trim()).length;
}

function syncOptionGroup(
  group: ProductCustomizationGroup,
  index = 0,
): ProductCustomizationGroup {
  const options = ensureMinOptionRows(group.options);
  const namedCount = namedOptionCount(options);
  const isMultiple = (group.maxSelections ?? 1) > 1;
  const required = Boolean(group.required);
  const name =
    group.name.trim() || (namedCount > 0 ? `ოფცია ${index + 1}` : "");

  return {
    ...group,
    kind: "option",
    name,
    options,
    minSelections: required ? 1 : 0,
    maxSelections: isMultiple
      ? Math.min(20, Math.max(2, namedCount || MIN_VARIANT_ROWS))
      : 1,
  };
}

function syncExclusionGroup(
  group: ProductCustomizationGroup,
): ProductCustomizationGroup {
  const options = ensureMinOptionRows(group.options).map((option) => ({
    ...option,
    price: 0,
  }));
  const namedCount = namedOptionCount(options);

  return {
    ...group,
    kind: "exclusion",
    name: EXCLUSION_GROUP_NAME,
    required: false,
    minSelections: 0,
    maxSelections: Math.min(20, Math.max(2, namedCount || MIN_VARIANT_ROWS)),
    options,
  };
}

function OptionRowsEditor({
  options,
  allowPrices,
  numberInputClass,
  namePlaceholder,
  onChange,
}: {
  options: OptionRow[];
  allowPrices: boolean;
  numberInputClass?: string;
  namePlaceholder: string;
  onChange: (options: OptionRow[]) => void;
}) {
  const rows = ensureMinOptionRows(options);

  function updateRow(index: number, patch: Partial<OptionRow>) {
    onChange(
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function addRow() {
    onChange([...rows, emptyOptionRow(rows.length)]);
  }

  function removeRow(index: number) {
    if (rows.length <= MIN_VARIANT_ROWS) return;
    onChange(
      rows
        .filter((_, rowIndex) => rowIndex !== index)
        .map((row, rowIndex) => ({ ...row, sortOrder: rowIndex })),
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={`${index}-${row.id ?? "new"}`} className="flex gap-2">
          <Input
            value={row.name}
            placeholder={namePlaceholder}
            onChange={(e) => updateRow(index, { name: e.target.value })}
            className="min-w-0 flex-1"
          />
          {allowPrices ? (
            <Input
              type="number"
              min={0}
              step={0.01}
              value={row.price > 0 ? String(row.price) : ""}
              placeholder="+₾"
              onChange={(e) => {
                const parsed = Number(e.target.value.replace(",", "."));
                updateRow(index, {
                  price:
                    e.target.value.trim() && Number.isFinite(parsed)
                      ? parsed
                      : 0,
                });
              }}
              className={`w-24 shrink-0 ${numberInputClass ?? ""}`}
            />
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-red-500"
            disabled={rows.length <= MIN_VARIANT_ROWS}
            onClick={() => removeRow(index)}
            aria-label="ვარიანტის წაშლა"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={addRow}>
        <Plus className="mr-1 size-4" />
        ვარიანტის დამატება
      </Button>
    </div>
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
    }, index),
  );

  if (exclusionGroup) {
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
  numberInputClass,
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
      i === index ? syncOptionGroup({ ...group, ...patch }, index) : group,
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
    const namedCount = namedOptionCount(group.options);

    updateOptionGroup(index, {
      maxSelections: multiple
        ? Math.min(20, Math.max(2, namedCount || MIN_VARIANT_ROWS))
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

  function updateExclusionGroup(patch: Partial<ProductCustomizationGroup>) {
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
                  placeholder="ოფციის სახელი (მაგ. სოუსი) *"
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
                  ვარიანტები
                </Label>
                <OptionRowsEditor
                  options={group.options}
                  allowPrices
                  numberInputClass={numberInputClass}
                  namePlaceholder="მაგ. კეტჩუპი"
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
                  გამონაკლისები
                </Label>
                <OptionRowsEditor
                  options={exclusionGroup.options}
                  allowPrices={false}
                  namePlaceholder="მაგ. კეტჩუპის გარეშე"
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
  )
    .filter((group) => {
      const namedOptions = group.options.filter((option) => option.name.trim());
      if (isExclusionGroup(group)) {
        return namedOptions.length > 0;
      }
      return namedOptions.length > 0;
    })
    .map((group, groupIndex) => ({
      ...group,
      kind: normalizeCustomizationGroupKind(group.kind),
      sortOrder: groupIndex,
      options: group.options
        .filter((option) => option.name.trim())
        .map((option, optionIndex) => ({
          ...option,
          sortOrder: optionIndex,
        })),
    }));
}

"use client";

import { formatGel } from "@/lib/admin/format";

export type CustomizationOption = {
  id: string;
  name: string;
  price: number;
};

export type CustomizationGroup = {
  id: string;
  name: string;
  description?: string | null;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: CustomizationOption[];
};

type CustomizationGroupPickerProps = {
  groups: CustomizationGroup[];
  selected: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
};

function groupSelectionCount(
  group: CustomizationGroup,
  selected: Record<string, number>,
) {
  return group.options.reduce(
    (sum, option) => sum + (selected[option.id] ?? 0),
    0,
  );
}

function toggleSingle(
  group: CustomizationGroup,
  optionId: string,
  selected: Record<string, number>,
) {
  const next = { ...selected };
  for (const option of group.options) {
    delete next[option.id];
  }
  next[optionId] = 1;
  return next;
}

function toggleMulti(
  group: CustomizationGroup,
  optionId: string,
  selected: Record<string, number>,
) {
  const next = { ...selected };
  const current = next[optionId] ?? 0;
  const count = groupSelectionCount(group, selected);

  if (current > 0) {
    delete next[optionId];
    return next;
  }

  if (count >= group.maxSelections) return selected;
  next[optionId] = 1;
  return next;
}

function GroupSection({
  group,
  selected,
  onChange,
}: {
  group: CustomizationGroup;
  selected: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
}) {
  const isSingle = group.maxSelections === 1;
  const count = groupSelectionCount(group, selected);

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold">
          {group.name}
          {group.required ? " *" : ""}
        </p>
        {group.description && (
          <p className="text-xs text-muted-foreground">{group.description}</p>
        )}
        {!isSingle && group.maxSelections > 1 && (
          <p className="text-xs text-neutral-400">
            აირჩიე {group.minSelections > 0 ? `მინ. ${group.minSelections}, ` : ""}
            მაქს. {group.maxSelections}
            {count > 0 ? ` · არჩეულია ${count}` : ""}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {group.options.map((option) => {
          const checked = (selected[option.id] ?? 0) > 0;
          const disabled =
            !isSingle &&
            !checked &&
            count >= group.maxSelections;

          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition ${
                checked
                  ? "border-[#FF0050] bg-[#FF0050]/5"
                  : "border-neutral-200 hover:border-neutral-300"
              } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type={isSingle ? "radio" : "checkbox"}
                  name={`group-${group.id}`}
                  checked={checked}
                  disabled={disabled}
                  onChange={() =>
                    onChange(
                      isSingle
                        ? toggleSingle(group, option.id, selected)
                        : toggleMulti(group, option.id, selected),
                    )
                  }
                  className="size-4 shrink-0 accent-[#FF0050]"
                />
                <span className="truncate text-sm font-medium">{option.name}</span>
              </span>
              {option.price > 0 && (
                <span className="shrink-0 text-sm text-neutral-600">
                  +{formatGel(option.price)}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function CustomizationGroupPicker({
  groups,
  selected,
  onChange,
}: CustomizationGroupPickerProps) {
  if (groups.length === 0) return null;

  return (
    <div className="mt-5 space-y-5">
      {groups.map((group) => (
        <GroupSection
          key={group.id}
          group={group}
          selected={selected}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

export function customizationSelectionTotal(
  groups: CustomizationGroup[],
  selected: Record<string, number>,
) {
  const optionPrices = new Map<string, number>();
  for (const group of groups) {
    for (const option of group.options) {
      optionPrices.set(option.id, option.price);
    }
  }

  return Object.entries(selected).reduce((sum, [id, qty]) => {
    return sum + (optionPrices.get(id) ?? 0) * qty;
  }, 0);
}

export function validateCustomizationSelection(
  groups: CustomizationGroup[],
  selected: Record<string, number>,
): string | null {
  for (const group of groups) {
    const count = groupSelectionCount(group, selected);
    const min = group.required
      ? Math.max(1, group.minSelections)
      : group.minSelections;

    if (count < min) {
      return group.required || min > 0
        ? `აირჩიე ${group.name.toLowerCase()}`
        : `${group.name}: არჩევანი არასწორია`;
    }
    if (count > group.maxSelections) {
      return `${group.name}: მაქსიმუმ ${group.maxSelections} არჩევანი`;
    }
  }
  return null;
}

import { BadRequestException } from '@nestjs/common';

export type CustomizationInput = {
  optionId: string;
  quantity?: number;
};

export type CustomizationGroupRule = {
  id: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: { id: string; isAvailable: boolean }[];
};

export function normalizeCustomizationInputs(
  customizations: CustomizationInput[] | undefined,
) {
  if (!customizations?.length) return [];
  const map = new Map<string, number>();
  for (const row of customizations) {
    const qty = Math.floor(Number(row.quantity ?? 1));
    if (!row.optionId || qty < 1 || qty > 20) continue;
    map.set(row.optionId, (map.get(row.optionId) ?? 0) + qty);
  }
  return [...map.entries()].map(([optionId, quantity]) => ({
    optionId,
    quantity,
  }));
}

export function customizationKey(optionId: string, quantity: number) {
  return `${optionId}:${quantity}`;
}

export function validateProductCustomizations(
  groups: CustomizationGroupRule[],
  inputs: CustomizationInput[],
) {
  const normalized = normalizeCustomizationInputs(inputs);
  const optionToGroup = new Map<string, CustomizationGroupRule>();
  for (const group of groups) {
    for (const option of group.options) {
      optionToGroup.set(option.id, group);
    }
  }

  const byGroup = new Map<string, { optionId: string; quantity: number }[]>();
  for (const row of normalized) {
    const group = optionToGroup.get(row.optionId);
    if (!group) {
      throw new BadRequestException('არჩევანი არასწორია');
    }
    const option = group.options.find((o) => o.id === row.optionId);
    if (!option?.isAvailable) {
      throw new BadRequestException(`${group.name}: ვარიანტი მიუწვდომელია`);
    }
    const list = byGroup.get(group.id) ?? [];
    list.push(row);
    byGroup.set(group.id, list);
  }

  for (const group of groups) {
    const selected = byGroup.get(group.id) ?? [];
    const count = selected.reduce((sum, row) => sum + row.quantity, 0);
    const min = group.required
      ? Math.max(1, group.minSelections)
      : group.minSelections;
    const max = Math.max(min, group.maxSelections);

    if (count < min) {
      throw new BadRequestException(
        group.required || min > 0
          ? `${group.name}: აირჩიე მინიმუმ ${min}`
          : `${group.name}: არჩევანი არასწორია`,
      );
    }
    if (count > max) {
      throw new BadRequestException(
        `${group.name}: მაქსიმუმ ${max} არჩევანი`,
      );
    }
  }

  return normalized;
}

export type CustomizationGroupWriteInput = {
  name: string;
  description?: string | null;
  kind?: 'option' | 'exclusion';
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
  sortOrder?: number;
  options: {
    name: string;
    price: number;
    sortOrder?: number;
    isAvailable?: boolean;
  }[];
};

function normalizeGroupKind(kind?: string | null): 'option' | 'exclusion' {
  return kind === 'exclusion' ? 'exclusion' : 'option';
}

export function sanitizeCustomizationGroups(
  groups: CustomizationGroupWriteInput[] | undefined,
): CustomizationGroupWriteInput[] {
  if (!Array.isArray(groups)) return [];

  return groups
    .map((group, groupIndex) => {
      const kind = normalizeGroupKind(group.kind);
      const options = (group.options ?? [])
        .map((option, optionIndex) => {
          const optionName = option.name?.trim();
          if (!optionName) return null;
          const price =
            kind === 'exclusion'
              ? 0
              : Math.max(0, Number(option.price) || 0);
          return {
            name: optionName,
            price,
            sortOrder: option.sortOrder ?? optionIndex,
            isAvailable: option.isAvailable !== false,
          };
        })
        .filter(Boolean) as CustomizationGroupWriteInput['options'];

      if (options.length === 0) return null;

      const name =
        group.name?.trim() ||
        (kind === 'exclusion' ? 'გამონაკლისები' : `ოფცია ${groupIndex + 1}`);
      const required =
        kind === 'exclusion' ? false : Boolean(group.required);
      const minSelections =
        kind === 'exclusion'
          ? 0
          : Math.max(
              0,
              Math.min(
                20,
                Math.floor(
                  Number(group.minSelections ?? (required ? 1 : 0)),
                ),
              ),
            );

      let maxSelections =
        kind === 'exclusion'
          ? Math.min(20, Math.max(2, options.length))
          : Math.max(
              1,
              Math.min(20, Math.floor(Number(group.maxSelections ?? 1))),
            );
      if (maxSelections < minSelections) maxSelections = minSelections;

      return {
        name: kind === 'exclusion' ? 'გამონაკლისები' : name,
        description: group.description?.trim() || null,
        kind,
        required,
        minSelections,
        maxSelections,
        sortOrder: group.sortOrder ?? groupIndex,
        options,
      };
    })
    .filter(Boolean) as CustomizationGroupWriteInput[];
}

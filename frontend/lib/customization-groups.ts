export type CustomizationGroupKind = "option" | "exclusion";

export const EXCLUSION_GROUP_NAME = "გამონაკლისები";

export function isExclusionGroup(group: {
  kind?: CustomizationGroupKind | string | null;
}): boolean {
  return group.kind === "exclusion";
}

export function normalizeCustomizationGroupKind(
  kind?: CustomizationGroupKind | string | null,
): CustomizationGroupKind {
  return kind === "exclusion" ? "exclusion" : "option";
}

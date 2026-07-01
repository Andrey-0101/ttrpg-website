import type { VtmV5AttributeKey } from "./schema";

export const VTM_V5_ATTRIBUTE_GROUPS = {
  physical: [
    "strength",
    "dexterity",
    "stamina",
  ],
  social: [
    "charisma",
    "manipulation",
    "composure",
  ],
  mental: [
    "intelligence",
    "wits",
    "resolve",
  ],
} as const satisfies Record<
  string,
  readonly VtmV5AttributeKey[]
>;

export type VtmV5AttributeGroupKey =
  keyof typeof VTM_V5_ATTRIBUTE_GROUPS;

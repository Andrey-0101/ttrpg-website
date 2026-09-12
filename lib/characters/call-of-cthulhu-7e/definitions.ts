export const COC7E_CHARACTERISTIC_KEYS = [
  "str",
  "con",
  "siz",
  "dex",
  "app",
  "int",
  "pow",
  "edu",
] as const;

export type Coc7eCharacteristicKey =
  (typeof COC7E_CHARACTERISTIC_KEYS)[number];

export const COC7E_FIXED_SKILLS = [
  { id: "accounting", baseValue: 5, developmentAllowed: true },
  { id: "anthropology", baseValue: 1, developmentAllowed: true },
  { id: "appraise", baseValue: 5, developmentAllowed: true },
  { id: "archaeology", baseValue: 1, developmentAllowed: true },
  { id: "charm", baseValue: 15, developmentAllowed: true },
  { id: "climb", baseValue: 20, developmentAllowed: true },
  { id: "creditRating", baseValue: 0, developmentAllowed: false },
  { id: "cthulhuMythos", baseValue: 0, developmentAllowed: false },
  { id: "disguise", baseValue: 5, developmentAllowed: true },
  { id: "dodge", baseValue: "dexHalf", developmentAllowed: true },
  { id: "driveAuto", baseValue: 20, developmentAllowed: true },
  { id: "electricalRepair", baseValue: 10, developmentAllowed: true },
  { id: "fastTalk", baseValue: 5, developmentAllowed: true },
  { id: "fightingBrawl", baseValue: 25, developmentAllowed: true },
  { id: "firearmsHandgun", baseValue: 20, developmentAllowed: true },
  { id: "firearmsRifleShotgun", baseValue: 25, developmentAllowed: true },
  { id: "firstAid", baseValue: 30, developmentAllowed: true },
  { id: "history", baseValue: 5, developmentAllowed: true },
  { id: "intimidate", baseValue: 15, developmentAllowed: true },
  { id: "jump", baseValue: 20, developmentAllowed: true },
  { id: "law", baseValue: 5, developmentAllowed: true },
  { id: "libraryUse", baseValue: 20, developmentAllowed: true },
  { id: "listen", baseValue: 20, developmentAllowed: true },
  { id: "locksmith", baseValue: 1, developmentAllowed: true },
  { id: "mechanicalRepair", baseValue: 10, developmentAllowed: true },
  { id: "medicine", baseValue: 1, developmentAllowed: true },
  { id: "naturalWorld", baseValue: 10, developmentAllowed: true },
  { id: "navigate", baseValue: 10, developmentAllowed: true },
  { id: "occult", baseValue: 5, developmentAllowed: true },
  { id: "persuade", baseValue: 10, developmentAllowed: true },
  { id: "psychoanalysis", baseValue: 1, developmentAllowed: true },
  { id: "psychology", baseValue: 10, developmentAllowed: true },
  { id: "ride", baseValue: 5, developmentAllowed: true },
  { id: "sleightOfHand", baseValue: 10, developmentAllowed: true },
  { id: "spotHidden", baseValue: 25, developmentAllowed: true },
  { id: "stealth", baseValue: 20, developmentAllowed: true },
  { id: "swim", baseValue: 20, developmentAllowed: true },
  { id: "throw", baseValue: 20, developmentAllowed: true },
  { id: "track", baseValue: 10, developmentAllowed: true },
] as const;

export type Coc7eFixedSkillId =
  (typeof COC7E_FIXED_SKILLS)[number]["id"];

export const COC7E_FIXED_SKILL_IDS = COC7E_FIXED_SKILLS.map(
  (skill) => skill.id,
) as readonly Coc7eFixedSkillId[];

export const COC7E_SKILL_COLUMNS = [
  [
    "accounting",
    "anthropology",
    "appraise",
    "archaeology",
    "charm",
    "climb",
    "creditRating",
    "cthulhuMythos",
    "disguise",
    "dodge",
    "driveAuto",
    "electricalRepair",
    "fastTalk",
    "fightingBrawl",
    "firearmsHandgun",
  ],
  [
    "firearmsRifleShotgun",
    "firstAid",
    "history",
    "intimidate",
    "jump",
    "law",
    "libraryUse",
    "listen",
    "locksmith",
    "mechanicalRepair",
    "medicine",
    "naturalWorld",
    "navigate",
    "occult",
  ],
  [
    "persuade",
    "psychoanalysis",
    "psychology",
    "ride",
    "sleightOfHand",
    "spotHidden",
    "stealth",
    "swim",
    "throw",
    "track",
  ],
] as const satisfies readonly (readonly Coc7eFixedSkillId[])[];

export const COC7E_SPECIALTY_CATEGORIES = [
  "artCraft",
  "fighting",
  "firearms",
  "languageOther",
  "languageOwn",
  "pilot",
  "science",
  "survival",
  "custom",
] as const;

export type Coc7eSpecialtyCategory =
  (typeof COC7E_SPECIALTY_CATEGORIES)[number];

export type Coc7eSpecialtyDefinition = {
  category: Coc7eSpecialtyCategory;
  count: number;
  baseValue: number | "edu" | null;
};

export const COC7E_SPECIALTY_DEFINITIONS = [
  { category: "artCraft", count: 2, baseValue: 5 },
  { category: "fighting", count: 2, baseValue: null },
  { category: "firearms", count: 1, baseValue: null },
  { category: "languageOther", count: 3, baseValue: 1 },
  { category: "languageOwn", count: 1, baseValue: "edu" },
  { category: "pilot", count: 1, baseValue: 1 },
  { category: "science", count: 3, baseValue: 1 },
  { category: "survival", count: 1, baseValue: 10 },
  { category: "custom", count: 4, baseValue: null },
] as const satisfies readonly Coc7eSpecialtyDefinition[];

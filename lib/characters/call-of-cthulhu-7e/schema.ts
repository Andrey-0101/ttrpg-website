import type { Json } from "@/types/database.types";

import {
  COC7E_CHARACTERISTIC_KEYS,
  COC7E_FIXED_SKILLS,
  COC7E_FIXED_SKILL_IDS,
  COC7E_SPECIALTY_CATEGORIES,
  COC7E_SPECIALTY_DEFINITIONS,
  type Coc7eCharacteristicKey,
  type Coc7eFixedSkillId,
  type Coc7eSpecialtyCategory,
} from "./definitions";

export const COC7E_SCHEMA_VERSION = 1 as const;
export const COC7E_NUMERIC_MAXIMUM = 999;

export type Coc7eIdentity = {
  occupation: string;
  birthplace: string;
  residence: string;
  age: number | null;
  gender: string;
};

export type Coc7eFixedSkillState = {
  value: number | null;
  developmentMarked: boolean;
};

export type Coc7eSkillInstance = {
  id: string;
  specialty: string;
  baseValue: number | null;
  value: number | null;
  developmentMarked: boolean;
};

export type Coc7eWeaponSkill =
  | { kind: "linked"; skillId: string }
  | { kind: "custom"; name: string; value: number | null };

export type Coc7eWeaponRow = {
  id: string;
  weapon: string;
  skill: Coc7eWeaponSkill;
  damage: string;
  attacks: string;
  range: string;
  ammo: string;
  malfunction: string;
};

export type Coc7eSheetData = {
  schemaVersion: typeof COC7E_SCHEMA_VERSION;
  identity: Coc7eIdentity;
  characteristics: Record<Coc7eCharacteristicKey, number | null>;
  vitals: {
    hitPoints: { current: number | null };
    magicPoints: { current: number | null };
    luck: { starting: number | null; current: number | null };
    sanity: { starting: number | null; current: number | null };
  };
  conditions: {
    temporaryInsanity: boolean;
    indefiniteInsanity: boolean;
    majorWound: boolean;
    unconscious: boolean;
    dying: boolean;
  };
  skills: {
    fixed: Record<Coc7eFixedSkillId, Coc7eFixedSkillState>;
    specialties: Record<Coc7eSpecialtyCategory, Coc7eSkillInstance[]>;
  };
  weapons: Coc7eWeaponRow[];
  story: string;
  backstory: {
    personalDescription: string;
    ideologyBeliefs: string;
    significantPeople: string;
    meaningfulLocations: string;
    treasuredPossessions: string;
    traits: string;
    injuriesScars: string;
    phobiasManias: string;
    arcaneTomesSpells: string;
    encountersWithStrangeEntities: string;
  };
  gearAndPossessions: string;
  wealth: {
    spendingLevel: string;
    cash: string;
    assets: string;
  };
  extensions: Record<string, Json>;
};

type JsonObject = Record<string, Json | undefined>;

const KNOWN_TOP_LEVEL_KEYS = new Set([
  "schemaVersion",
  "identity",
  "characteristics",
  "vitals",
  "conditions",
  "skills",
  "weapons",
  "story",
  "backstory",
  "gearAndPossessions",
  "wealth",
  "extensions",
]);

function isJsonObject(value: Json | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readObject(value: Json | undefined): JsonObject {
  return isJsonObject(value) ? value : {};
}

function readString(value: Json | undefined): string {
  return typeof value === "string" ? value : "";
}

function readBoolean(value: Json | undefined): boolean {
  return value === true;
}

export function normalizeCoc7eNumber(value: unknown): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > COC7E_NUMERIC_MAXIMUM
  ) {
    return null;
  }

  return value;
}

function createFixedSkillDefaults(): Record<
  Coc7eFixedSkillId,
  Coc7eFixedSkillState
> {
  return Object.fromEntries(
    COC7E_FIXED_SKILLS.map((skill) => [
      skill.id,
      { value: null, developmentMarked: false },
    ]),
  ) as Record<Coc7eFixedSkillId, Coc7eFixedSkillState>;
}

function createSpecialtyDefaults(): Record<
  Coc7eSpecialtyCategory,
  Coc7eSkillInstance[]
> {
  return Object.fromEntries(
    COC7E_SPECIALTY_DEFINITIONS.map((definition) => [
      definition.category,
      Array.from({ length: definition.count }, (_, index) => ({
        id: `${definition.category}-${index + 1}`,
        specialty: "",
        baseValue: null,
        value: null,
        developmentMarked: false,
      })),
    ]),
  ) as Record<Coc7eSpecialtyCategory, Coc7eSkillInstance[]>;
}

function createWeaponDefaults(): Coc7eWeaponRow[] {
  return Array.from({ length: 3 }, (_, index) => ({
    id: `weapon-${index + 1}`,
    weapon: "",
    skill: { kind: "custom" as const, name: "", value: null },
    damage: "",
    attacks: "",
    range: "",
    ammo: "",
    malfunction: "",
  }));
}

export function createDefaultCoc7eSheetData(): Coc7eSheetData {
  return {
    schemaVersion: COC7E_SCHEMA_VERSION,
    identity: {
      occupation: "",
      birthplace: "",
      residence: "",
      age: null,
      gender: "",
    },
    characteristics: Object.fromEntries(
      COC7E_CHARACTERISTIC_KEYS.map((key) => [key, null]),
    ) as Record<Coc7eCharacteristicKey, number | null>,
    vitals: {
      hitPoints: { current: null },
      magicPoints: { current: null },
      luck: { starting: null, current: null },
      sanity: { starting: null, current: null },
    },
    conditions: {
      temporaryInsanity: false,
      indefiniteInsanity: false,
      majorWound: false,
      unconscious: false,
      dying: false,
    },
    skills: {
      fixed: createFixedSkillDefaults(),
      specialties: createSpecialtyDefaults(),
    },
    weapons: createWeaponDefaults(),
    story: "",
    backstory: {
      personalDescription: "",
      ideologyBeliefs: "",
      significantPeople: "",
      meaningfulLocations: "",
      treasuredPossessions: "",
      traits: "",
      injuriesScars: "",
      phobiasManias: "",
      arcaneTomesSpells: "",
      encountersWithStrangeEntities: "",
    },
    gearAndPossessions: "",
    wealth: {
      spendingLevel: "",
      cash: "",
      assets: "",
    },
    extensions: {},
  };
}

function makeUniqueId(
  candidate: string,
  fallback: string,
  usedIds: Set<string>,
): string {
  const base = candidate.trim() || fallback;
  let id = base;
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(id);
  return id;
}

function normalizeFixedSkills(
  value: Json | undefined,
): Record<Coc7eFixedSkillId, Coc7eFixedSkillState> {
  const source = readObject(value);

  return Object.fromEntries(
    COC7E_FIXED_SKILLS.map((definition) => {
      const state = readObject(source[definition.id]);

      return [
        definition.id,
        {
          value: normalizeCoc7eNumber(state.value),
          developmentMarked:
            definition.developmentAllowed && readBoolean(state.developmentMarked),
        },
      ];
    }),
  ) as Record<Coc7eFixedSkillId, Coc7eFixedSkillState>;
}

function normalizeSpecialtyRows(
  value: Json | undefined,
  category: Coc7eSpecialtyCategory,
): Coc7eSkillInstance[] {
  const definition = COC7E_SPECIALTY_DEFINITIONS.find(
    (item) => item.category === category,
  );
  const source = Array.isArray(value) ? value : [];
  const length = Math.max(definition?.count ?? 0, source.length);
  const usedIds = new Set<string>();

  return Array.from({ length }, (_, index) => {
    const item = readObject(source[index]);
    const fixedBase = definition?.baseValue;

    return {
      id: makeUniqueId(
        readString(item.id),
        `${category}-${index + 1}`,
        usedIds,
      ),
      specialty: readString(item.specialty),
      baseValue:
        fixedBase === null ? normalizeCoc7eNumber(item.baseValue) : null,
      value: normalizeCoc7eNumber(item.value),
      developmentMarked: readBoolean(item.developmentMarked),
    };
  });
}

function normalizeSpecialties(
  value: Json | undefined,
): Record<Coc7eSpecialtyCategory, Coc7eSkillInstance[]> {
  const source = readObject(value);

  return Object.fromEntries(
    COC7E_SPECIALTY_CATEGORIES.map((category) => [
      category,
      normalizeSpecialtyRows(source[category], category),
    ]),
  ) as Record<Coc7eSpecialtyCategory, Coc7eSkillInstance[]>;
}

function normalizeWeaponSkill(
  value: Json | undefined,
  validSkillIds: Set<string>,
): Coc7eWeaponSkill {
  const source = readObject(value);

  if (
    source.kind === "linked" &&
    typeof source.skillId === "string" &&
    validSkillIds.has(source.skillId)
  ) {
    return { kind: "linked", skillId: source.skillId };
  }

  const invalidLinkedId =
    source.kind === "linked" && typeof source.skillId === "string"
      ? source.skillId
      : "";

  return {
    kind: "custom",
    name: readString(source.name) || invalidLinkedId,
    value: normalizeCoc7eNumber(source.value),
  };
}

function normalizeWeapons(
  value: Json | undefined,
  specialties: Record<Coc7eSpecialtyCategory, Coc7eSkillInstance[]>,
): Coc7eWeaponRow[] {
  const source = Array.isArray(value) ? value : [];
  const length = Math.max(3, source.length);
  const usedIds = new Set<string>();
  const validSkillIds = new Set<string>(COC7E_FIXED_SKILL_IDS);

  for (const rows of Object.values(specialties)) {
    for (const row of rows) {
      validSkillIds.add(row.id);
    }
  }

  return Array.from({ length }, (_, index) => {
    const item = readObject(source[index]);

    return {
      id: makeUniqueId(readString(item.id), `weapon-${index + 1}`, usedIds),
      weapon: readString(item.weapon),
      skill: normalizeWeaponSkill(item.skill, validSkillIds),
      damage: readString(item.damage),
      attacks: readString(item.attacks),
      range: readString(item.range),
      ammo: readString(item.ammo),
      malfunction: readString(item.malfunction),
    };
  });
}

function normalizeExtensions(source: JsonObject): Record<string, Json> {
  const result: Record<string, Json> = {};
  const explicitExtensions = readObject(source.extensions);

  for (const [key, value] of Object.entries(explicitExtensions)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }

  for (const [key, value] of Object.entries(source)) {
    if (!KNOWN_TOP_LEVEL_KEYS.has(key) && value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

export function normalizeCoc7eSheetData(value: Json): Coc7eSheetData {
  const source = readObject(value);
  const identity = readObject(source.identity);
  const characteristics = readObject(source.characteristics);
  const vitals = readObject(source.vitals);
  const hitPoints = readObject(vitals.hitPoints);
  const magicPoints = readObject(vitals.magicPoints);
  const luck = readObject(vitals.luck);
  const sanity = readObject(vitals.sanity);
  const conditions = readObject(source.conditions);
  const skills = readObject(source.skills);
  const specialties = normalizeSpecialties(
    readObject(skills.specialties) as Json,
  );
  const backstory = readObject(source.backstory);
  const wealth = readObject(source.wealth);

  return {
    schemaVersion: COC7E_SCHEMA_VERSION,
    identity: {
      occupation: readString(identity.occupation),
      birthplace: readString(identity.birthplace),
      residence: readString(identity.residence),
      age: normalizeCoc7eNumber(identity.age),
      gender: readString(identity.gender),
    },
    characteristics: Object.fromEntries(
      COC7E_CHARACTERISTIC_KEYS.map((key) => [
        key,
        normalizeCoc7eNumber(characteristics[key]),
      ]),
    ) as Record<Coc7eCharacteristicKey, number | null>,
    vitals: {
      hitPoints: { current: normalizeCoc7eNumber(hitPoints.current) },
      magicPoints: { current: normalizeCoc7eNumber(magicPoints.current) },
      luck: {
        starting: normalizeCoc7eNumber(luck.starting),
        current: normalizeCoc7eNumber(luck.current),
      },
      sanity: {
        starting: normalizeCoc7eNumber(sanity.starting),
        current: normalizeCoc7eNumber(sanity.current),
      },
    },
    conditions: {
      temporaryInsanity: readBoolean(conditions.temporaryInsanity),
      indefiniteInsanity: readBoolean(conditions.indefiniteInsanity),
      majorWound: readBoolean(conditions.majorWound),
      unconscious: readBoolean(conditions.unconscious),
      dying: readBoolean(conditions.dying),
    },
    skills: {
      fixed: normalizeFixedSkills(readObject(skills.fixed) as Json),
      specialties,
    },
    weapons: normalizeWeapons(source.weapons, specialties),
    story: readString(source.story),
    backstory: {
      personalDescription: readString(backstory.personalDescription),
      ideologyBeliefs: readString(backstory.ideologyBeliefs),
      significantPeople: readString(backstory.significantPeople),
      meaningfulLocations: readString(backstory.meaningfulLocations),
      treasuredPossessions: readString(backstory.treasuredPossessions),
      traits: readString(backstory.traits),
      injuriesScars: readString(backstory.injuriesScars),
      phobiasManias: readString(backstory.phobiasManias),
      arcaneTomesSpells: readString(backstory.arcaneTomesSpells),
      encountersWithStrangeEntities: readString(
        backstory.encountersWithStrangeEntities,
      ),
    },
    gearAndPossessions: readString(source.gearAndPossessions),
    wealth: {
      spendingLevel: readString(wealth.spendingLevel),
      cash: readString(wealth.cash),
      assets: readString(wealth.assets),
    },
    extensions: normalizeExtensions(source),
  };
}

export function getCoc7eThresholds(value: number | null): {
  regular: number | null;
  hard: number | null;
  extreme: number | null;
} {
  return {
    regular: value,
    hard: value === null ? null : Math.floor(value / 2),
    extreme: value === null ? null : Math.floor(value / 5),
  };
}

export function getCoc7eMaximumHitPoints(
  sheetData: Coc7eSheetData,
): number | null {
  const { con, siz } = sheetData.characteristics;
  return con === null || siz === null ? null : Math.floor((con + siz) / 10);
}

export function getCoc7eMaximumMagicPoints(
  sheetData: Coc7eSheetData,
): number | null {
  const { pow } = sheetData.characteristics;
  return pow === null ? null : Math.floor(pow / 5);
}

export function getCoc7eFixedSkillBase(
  sheetData: Coc7eSheetData,
  skillId: Coc7eFixedSkillId,
): number | null {
  const definition = COC7E_FIXED_SKILLS.find((skill) => skill.id === skillId);

  if (!definition) {
    return null;
  }

  if (definition.baseValue === "dexHalf") {
    const dexterity = sheetData.characteristics.dex;
    return dexterity === null ? null : Math.floor(dexterity / 2);
  }

  return definition.baseValue;
}

export function getCoc7eFixedSkillValue(
  sheetData: Coc7eSheetData,
  skillId: Coc7eFixedSkillId,
): number | null {
  return (
    sheetData.skills.fixed[skillId].value ??
    getCoc7eFixedSkillBase(sheetData, skillId)
  );
}

export function getCoc7eSpecialtyBase(
  sheetData: Coc7eSheetData,
  category: Coc7eSpecialtyCategory,
  row: Coc7eSkillInstance,
): number | null {
  if (category === "languageOwn") {
    return sheetData.characteristics.edu;
  }

  const definition = COC7E_SPECIALTY_DEFINITIONS.find(
    (item) => item.category === category,
  );

  return typeof definition?.baseValue === "number"
    ? definition.baseValue
    : row.baseValue;
}

export function getCoc7eSpecialtyValue(
  sheetData: Coc7eSheetData,
  category: Coc7eSpecialtyCategory,
  row: Coc7eSkillInstance,
): number | null {
  return row.value ?? getCoc7eSpecialtyBase(sheetData, category, row);
}

export function getCoc7eMaximumSanity(
  sheetData: Coc7eSheetData,
): number {
  return 99 - (getCoc7eFixedSkillValue(sheetData, "cthulhuMythos") ?? 0);
}

export function getCoc7eInsaneThreshold(
  sheetData: Coc7eSheetData,
): number | null {
  const startingSanity = sheetData.vitals.sanity.starting;
  return startingSanity === null ? null : Math.floor(startingSanity / 5);
}

export function getCoc7eMove(sheetData: Coc7eSheetData): number | null {
  const { str, dex, siz } = sheetData.characteristics;
  if (str === null || dex === null || siz === null) {
    return null;
  }

  const base = str < siz && dex < siz ? 7 : str >= siz && dex >= siz ? 9 : 8;
  const age = sheetData.identity.age;
  const agePenalty = age !== null && age >= 40 ? Math.floor((age - 40) / 10) + 1 : 0;

  return Math.max(0, base - agePenalty);
}

export function getCoc7eBuildAndDamageBonus(
  sheetData: Coc7eSheetData,
): { build: number; damageBonus: string } | null {
  const { str, siz } = sheetData.characteristics;
  if (str === null || siz === null) {
    return null;
  }

  const total = str + siz;
  if (total <= 64) return { build: -2, damageBonus: "-2" };
  if (total <= 84) return { build: -1, damageBonus: "-1" };
  if (total <= 124) return { build: 0, damageBonus: "none" };
  if (total <= 164) return { build: 1, damageBonus: "+1D4" };
  if (total <= 204) return { build: 2, damageBonus: "+1D6" };

  const extraDice = Math.floor((total - 205) / 80) + 2;
  return { build: extraDice + 1, damageBonus: `+${extraDice}D6` };
}

export function updateCoc7eCharacteristic(
  sheetData: Coc7eSheetData,
  key: Coc7eCharacteristicKey,
  value: number | null,
): Coc7eSheetData {
  const nextSheetData: Coc7eSheetData = {
    ...sheetData,
    characteristics: {
      ...sheetData.characteristics,
      [key]: value,
    },
  };

  if (
    key === "pow" &&
    value !== null &&
    sheetData.vitals.sanity.starting === null
  ) {
    return {
      ...nextSheetData,
      vitals: {
        ...nextSheetData.vitals,
        sanity: {
          ...nextSheetData.vitals.sanity,
          starting: value,
        },
      },
    };
  }

  return nextSheetData;
}

export function getCoc7eSkillOptions(
  sheetData: Coc7eSheetData,
): { id: string; value: number | null }[] {
  const fixed = COC7E_FIXED_SKILL_IDS.map((id) => ({
    id,
    value: getCoc7eFixedSkillValue(sheetData, id),
  }));
  const specialties = COC7E_SPECIALTY_CATEGORIES.flatMap((category) =>
    sheetData.skills.specialties[category].map((row) => ({
      id: row.id,
      value: getCoc7eSpecialtyValue(sheetData, category, row),
    })),
  );

  return [...fixed, ...specialties];
}

export type Coc7eValidationError =
  | "specialtyNameRequired"
  | "weaponSkillNameRequired"
  | "invalidLinkedWeaponSkill";

export function validateCoc7eSheetData(
  sheetData: Coc7eSheetData,
): Coc7eValidationError[] {
  const errors = new Set<Coc7eValidationError>();
  const validSkillIds = new Set(
    getCoc7eSkillOptions(sheetData).map((skill) => skill.id),
  );

  for (const category of COC7E_SPECIALTY_CATEGORIES) {
    const definition = COC7E_SPECIALTY_DEFINITIONS.find(
      (item) => item.category === category,
    );

    for (const row of sheetData.skills.specialties[category]) {
      const hasContent =
        row.value !== null ||
        row.developmentMarked ||
        (definition?.baseValue === null && row.baseValue !== null);

      if (hasContent && !row.specialty.trim()) {
        errors.add("specialtyNameRequired");
      }
    }
  }

  for (const weapon of sheetData.weapons) {
    if (weapon.skill.kind === "linked") {
      if (!validSkillIds.has(weapon.skill.skillId)) {
        errors.add("invalidLinkedWeaponSkill");
      }
    } else if (
      weapon.skill.value !== null &&
      !weapon.skill.name.trim()
    ) {
      errors.add("weaponSkillNameRequired");
    }
  }

  return [...errors];
}

import type { Json } from "@/types/database.types";

export const VTM_V5_SCHEMA_VERSION = 3 as const;

export const VTM_V5_ATTRIBUTE_KEYS = [
  "strength",
  "dexterity",
  "stamina",
  "charisma",
  "manipulation",
  "composure",
  "intelligence",
  "wits",
  "resolve",
] as const;

export type VtmV5AttributeKey =
  (typeof VTM_V5_ATTRIBUTE_KEYS)[number];

export const VTM_V5_SKILL_GROUPS = {
  physical: [
    "athletics",
    "brawl",
    "craft",
    "drive",
    "firearms",
    "larceny",
    "melee",
    "stealth",
    "survival",
  ],
  social: [
    "animalKen",
    "etiquette",
    "insight",
    "intimidation",
    "leadership",
    "performance",
    "persuasion",
    "streetwise",
    "subterfuge",
  ],
  mental: [
    "academics",
    "awareness",
    "finance",
    "investigation",
    "medicine",
    "occult",
    "politics",
    "science",
    "technology",
  ],
} as const;

export const VTM_V5_SKILL_KEYS = [
  ...VTM_V5_SKILL_GROUPS.physical,
  ...VTM_V5_SKILL_GROUPS.social,
  ...VTM_V5_SKILL_GROUPS.mental,
] as const;

export type VtmV5SkillKey =
  (typeof VTM_V5_SKILL_KEYS)[number];

export type VtmV5Identity = {
  clan: string;
  concept: string;
  predatorType: string;
  sire: string;
  generation: number;
  sect: string;
  ambition: string;
  desire: string;
  chronicle: string;
};

export type VtmV5Discipline = {
  id: string;
  name: string;
  dots: number;
  powers: string[];
  notes: string;
};

export type VtmV5AdvantageCategory =
  | "background"
  | "merit"
  | "flaw"
  | "other";

export type VtmV5Advantage = {
  id: string;
  name: string;
  dots: number;
  category: VtmV5AdvantageCategory;
  notes: string;
};

export type VtmV5DamageTrack = {
  superficial: number;
  aggravated: number;
  bonus: number;
};

export type VtmV5Trackers = {
  resonance: string;
  hunger: number;
  humanity: number;
  stains: number;
  bloodPotency: number;
  health: VtmV5DamageTrack;
  willpower: VtmV5DamageTrack;
};

export type VtmV5BloodPotencyDetails = {
  bloodSurge: number;
  mendAmount: string;
  powerBonus: number;
  rouseReRoll: number;
  feedingPenalty: string;
  baneSeverity: number;
};

export type VtmV5Biography = {
  trueAge: string;
  apparentAge: string;
  dateOfBirth: string;
  dateOfDeath: string;
  appearance: string;
  distinguishingFeatures: string;
  history: string;
};

export type VtmV5SheetData = {
  schemaVersion: typeof VTM_V5_SCHEMA_VERSION;
  identity: VtmV5Identity;
  attributes: Record<VtmV5AttributeKey, number>;
  skills: Record<VtmV5SkillKey, number>;
  skillSpecialties: Partial<
    Record<VtmV5SkillKey, string[]>
  >;
  disciplines: VtmV5Discipline[];
  advantages: VtmV5Advantage[];
  trackers: VtmV5Trackers;
  chronicleTenets: string[];
  convictions: string[];
  touchstones: string[];
  clanBane: string;
  bloodPotencyDetails: VtmV5BloodPotencyDetails;
  experience: {
    total: number;
    spent: number;
  };
  biography: VtmV5Biography;
  notes: string;
  extensions: Record<string, Json>;
};

type JsonObject = {
  [key: string]: Json | undefined;
};

const KNOWN_TOP_LEVEL_KEYS = new Set([
  "schemaVersion",
  "identity",
  "attributes",
  "skills",
  "skillSpecialties",
  "disciplines",
  "advantages",
  "trackers",
  "chronicleTenets",
  "convictions",
  "touchstones",
  "clanBane",
  "bloodPotencyDetails",
  "experience",
  "biography",
  "notes",
  "extensions",
  "clan",
  "hunger",
  "resonance",
]);

function isJsonObject(
  value: Json | undefined,
): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readObject(value: Json | undefined): JsonObject {
  return isJsonObject(value) ? value : {};
}

function readString(
  value: Json | undefined,
  fallback = "",
): string {
  return typeof value === "string" ? value : fallback;
}

function readInteger(
  value: Json | undefined,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(minimum, Math.trunc(value)),
  );
}

function readStringArray(value: Json | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

function createRatingRecord<K extends string>(
  keys: readonly K[],
  defaultValue: number,
): Record<K, number> {
  return Object.fromEntries(
    keys.map((key) => [key, defaultValue]),
  ) as Record<K, number>;
}

function normalizeRatingRecord<K extends string>(
  value: Json | undefined,
  keys: readonly K[],
  defaultValue: number,
): Record<K, number> {
  const source = readObject(value);

  return Object.fromEntries(
    keys.map((key) => [
      key,
      readInteger(source[key], 0, 5, defaultValue),
    ]),
  ) as Record<K, number>;
}

function normalizeSkillSpecialties(
  value: Json | undefined,
): Partial<Record<VtmV5SkillKey, string[]>> {
  const source = readObject(value);
  const specialties: Partial<
    Record<VtmV5SkillKey, string[]>
  > = {};

  for (const skill of VTM_V5_SKILL_KEYS) {
    const values = readStringArray(source[skill]);

    if (values.length > 0) {
      specialties[skill] = values;
    }
  }

  return specialties;
}

function normalizeDisciplines(
  value: Json | undefined,
): VtmV5Discipline[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item, index) => {
    if (!isJsonObject(item)) {
      return [];
    }

    const id = readString(item.id).trim();
    const name = readString(item.name).trim();
    const dots = readInteger(item.dots, 0, 5, 0);
    const powers = readStringArray(item.powers);
    const notes = readString(item.notes);

    const hasContent =
      Boolean(id) ||
      Boolean(name) ||
      dots > 0 ||
      powers.length > 0 ||
      Boolean(notes.trim());

    if (!hasContent) {
      return [];
    }

    return [{
      id: id || `discipline-${index + 1}`,
      name,
      dots,
      powers,
      notes,
    }];
  });
}

function normalizeAdvantageCategory(
  value: Json | undefined,
): VtmV5AdvantageCategory {
  return value === "background" ||
    value === "merit" ||
    value === "flaw" ||
    value === "other"
    ? value
    : "other";
}

function normalizeAdvantages(
  value: Json | undefined,
): VtmV5Advantage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item, index) => {
    if (!isJsonObject(item)) {
      return [];
    }

    const id = readString(item.id).trim();
    const name = readString(item.name).trim();
    const dots = readInteger(item.dots, 0, 5, 0);
    const category = normalizeAdvantageCategory(
      item.category,
    );
    const notes = readString(item.notes);

    const hasContent =
      Boolean(id) ||
      Boolean(name) ||
      dots > 0 ||
      category !== "other" ||
      Boolean(notes.trim());

    if (!hasContent) {
      return [];
    }

    return [{
      id: id || `advantage-${index + 1}`,
      name,
      dots,
      category,
      notes,
    }];
  });
}

function normalizeDamageTrack(
  value: Json | undefined,
): VtmV5DamageTrack {
  const source = readObject(value);

  return {
    superficial: readInteger(
      source.superficial,
      0,
      20,
      0,
    ),
    aggravated: readInteger(
      source.aggravated,
      0,
      20,
      0,
    ),
    bonus: readInteger(source.bonus, 0, 10, 0),
  };
}

function normalizeBloodPotencyDetails(
  value: Json | undefined,
): VtmV5BloodPotencyDetails {
  const source = readObject(value);

  return {
    bloodSurge: readInteger(
      source.bloodSurge,
      0,
      10,
      0,
    ),
    mendAmount: readString(source.mendAmount),
    powerBonus: readInteger(
      source.powerBonus,
      0,
      10,
      0,
    ),
    rouseReRoll: readInteger(
      source.rouseReRoll,
      0,
      10,
      0,
    ),
    feedingPenalty: readString(
      source.feedingPenalty,
    ),
    baneSeverity: readInteger(
      source.baneSeverity,
      0,
      10,
      0,
    ),
  };
}

function normalizeBiography(
  value: Json | undefined,
): VtmV5Biography {
  const source = readObject(value);

  return {
    trueAge: readString(source.trueAge),
    apparentAge: readString(source.apparentAge),
    dateOfBirth: readString(source.dateOfBirth),
    dateOfDeath: readString(source.dateOfDeath),
    appearance: readString(source.appearance),
    distinguishingFeatures: readString(
      source.distinguishingFeatures,
    ),
    history: readString(source.history),
  };
}

function normalizeExtensions(
  source: JsonObject,
): Record<string, Json> {
  const result: Record<string, Json> = {};
  const explicitExtensions = readObject(
    source.extensions,
  );

  for (
    const [key, value]
    of Object.entries(explicitExtensions)
  ) {
    if (value !== undefined) {
      result[key] = value;
    }
  }

  for (const [key, value] of Object.entries(source)) {
    if (
      !KNOWN_TOP_LEVEL_KEYS.has(key) &&
      value !== undefined
    ) {
      result[key] = value;
    }
  }

  return result;
}

export function createDefaultVtmV5SheetData():
  VtmV5SheetData {
  return {
    schemaVersion: VTM_V5_SCHEMA_VERSION,
    identity: {
      clan: "",
      concept: "",
      predatorType: "",
      sire: "",
      generation: 13,
      sect: "",
      ambition: "",
      desire: "",
      chronicle: "",
    },
    attributes: createRatingRecord(
      VTM_V5_ATTRIBUTE_KEYS,
      1,
    ),
    skills: createRatingRecord(
      VTM_V5_SKILL_KEYS,
      0,
    ),
    skillSpecialties: {},
    disciplines: [],
    advantages: [],
    trackers: {
      resonance: "",
      hunger: 1,
      humanity: 7,
      stains: 0,
      bloodPotency: 0,
      health: {
        superficial: 0,
        aggravated: 0,
        bonus: 0,
      },
      willpower: {
        superficial: 0,
        aggravated: 0,
        bonus: 0,
      },
    },
    chronicleTenets: [],
    convictions: [],
    touchstones: [],
    clanBane: "",
    bloodPotencyDetails: {
      bloodSurge: 0,
      mendAmount: "",
      powerBonus: 0,
      rouseReRoll: 0,
      feedingPenalty: "",
      baneSeverity: 0,
    },
    experience: {
      total: 0,
      spent: 0,
    },
    biography: {
      trueAge: "",
      apparentAge: "",
      dateOfBirth: "",
      dateOfDeath: "",
      appearance: "",
      distinguishingFeatures: "",
      history: "",
    },
    notes: "",
    extensions: {},
  };
}

export function normalizeVtmV5SheetData(
  value: Json,
): VtmV5SheetData {
  const source = readObject(value);
  const defaults = createDefaultVtmV5SheetData();
  const identity = readObject(source.identity);
  const trackers = readObject(source.trackers);
  const experience = readObject(source.experience);

  return {
    schemaVersion: VTM_V5_SCHEMA_VERSION,
    identity: {
      clan: readString(
        identity.clan,
        readString(source.clan),
      ),
      concept: readString(identity.concept),
      predatorType: readString(
        identity.predatorType,
      ),
      sire: readString(identity.sire),
      generation: readInteger(
        identity.generation,
        4,
        16,
        defaults.identity.generation,
      ),
      sect: readString(identity.sect),
      ambition: readString(identity.ambition),
      desire: readString(identity.desire),
      chronicle: readString(identity.chronicle),
    },
    attributes: normalizeRatingRecord(
      source.attributes,
      VTM_V5_ATTRIBUTE_KEYS,
      1,
    ),
    skills: normalizeRatingRecord(
      source.skills,
      VTM_V5_SKILL_KEYS,
      0,
    ),
    skillSpecialties: normalizeSkillSpecialties(
      source.skillSpecialties,
    ),
    disciplines: normalizeDisciplines(
      source.disciplines,
    ),
    advantages: normalizeAdvantages(
      source.advantages,
    ),
    trackers: {
      resonance: readString(
        trackers.resonance,
        readString(source.resonance),
      ),
      hunger: readInteger(
        trackers.hunger ?? source.hunger,
        0,
        5,
        defaults.trackers.hunger,
      ),
      humanity: readInteger(
        trackers.humanity,
        0,
        10,
        defaults.trackers.humanity,
      ),
      stains: readInteger(
        trackers.stains,
        0,
        10,
        defaults.trackers.stains,
      ),
      bloodPotency: readInteger(
        trackers.bloodPotency,
        0,
        10,
        defaults.trackers.bloodPotency,
      ),
      health: normalizeDamageTrack(
        trackers.health,
      ),
      willpower: normalizeDamageTrack(
        trackers.willpower,
      ),
    },
    chronicleTenets: readStringArray(
      source.chronicleTenets,
    ),
    convictions: readStringArray(
      source.convictions,
    ),
    touchstones: readStringArray(
      source.touchstones,
    ),
    clanBane: readString(source.clanBane),
    bloodPotencyDetails:
      normalizeBloodPotencyDetails(
        source.bloodPotencyDetails,
      ),
    experience: {
      total: readInteger(
        experience.total,
        0,
        9999,
        0,
      ),
      spent: readInteger(
        experience.spent,
        0,
        9999,
        0,
      ),
    },
    biography: normalizeBiography(
      source.biography,
    ),
    notes: readString(source.notes),
    extensions: normalizeExtensions(source),
  };
}

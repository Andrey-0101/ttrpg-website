export const GAME_SYSTEMS = {
  "vtm-v5": {
    id: "vtm-v5",
    name: "Vampire: The Masquerade (v5)",
    description:
      "A game of personal horror, political intrigue, and struggling with the Beast.",
    available: true,
    legacyValues: ["Vampire: The Masquerade V5"],
    defaultSheetData: {
      schemaVersion: 1,
      clan: "",
      hunger: 1,
    },
  },

  "call-of-cthulhu-7e": {
    id: "call-of-cthulhu-7e",
    name: "Call of Cthulhu 7th Edition",
    description:
      "An investigative horror game about mysteries, dangerous knowledge, and the Cthulhu Mythos.",
    available: false,
    legacyValues: ["Call of Cthulhu"],
    defaultSheetData: {
      schemaVersion: 1,
    },
  },
} as const;

export type GameSystemId = keyof typeof GAME_SYSTEMS;

export function getGameSystem(systemId: string) {
  return GAME_SYSTEMS[systemId as GameSystemId] ?? null;
}

export function normalizeGameSystemId(
  value: string
): GameSystemId | null {
  if (value in GAME_SYSTEMS) {
    return value as GameSystemId;
  }

  const matchedSystem = Object.values(GAME_SYSTEMS).find((system) =>
    system.legacyValues.some((legacyValue) => legacyValue === value)
  );

  return matchedSystem?.id ?? null;
}

export function getGameSystemName(value: string) {
  const normalizedId = normalizeGameSystemId(value);

  if (!normalizedId) {
    return value;
  }

  return GAME_SYSTEMS[normalizedId].name;
}
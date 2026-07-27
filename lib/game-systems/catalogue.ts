export const GAME_SYSTEM_CAPABILITIES = [
  "gameArea",
  "characterCreation",
  "campaignCreation",
  "diceRoller",
] as const;

export type GameSystemCapability =
  (typeof GAME_SYSTEM_CAPABILITIES)[number];

export type PlannedCapability = {
  status: "planned";
};

export type AvailableCapability = {
  status: "available";
  route: string;
};

export type GameSystemCapabilityState =
  | AvailableCapability
  | PlannedCapability;

type GameSystemDefinition = {
  id: string;
  translationKey: string;
  legacyValues: readonly string[];
  capabilities: Record<GameSystemCapability, GameSystemCapabilityState>;
};

const plannedCapabilities = {
  gameArea: { status: "planned" },
  characterCreation: { status: "planned" },
  campaignCreation: { status: "planned" },
  diceRoller: { status: "planned" },
} as const satisfies Record<GameSystemCapability, PlannedCapability>;

export const GAME_SYSTEM_CATALOGUE = [
  {
    id: "vtm-v5",
    translationKey: "vtmV5",
    legacyValues: [
      "Vampire: The Masquerade V5",
      "Vampire: The Masquerade (v5)",
    ],
    capabilities: {
      gameArea: {
        status: "available",
        route: "/games/vampire-the-masquerade",
      },
      characterCreation: {
        status: "available",
        route: "/characters/new/vtm-v5",
      },
      campaignCreation: {
        status: "available",
        route: "/campaigns/new",
      },
      diceRoller: {
        status: "available",
        route: "/games/vampire-the-masquerade/tools/dice",
      },
    },
  },
  {
    id: "alien",
    translationKey: "alien",
    legacyValues: [],
    capabilities: plannedCapabilities,
  },
  {
    id: "black-powder-and-brimstone",
    translationKey: "blackPowderAndBrimstone",
    legacyValues: [],
    capabilities: plannedCapabilities,
  },
  {
    id: "call-of-cthulhu-7e",
    translationKey: "callOfCthulhu",
    legacyValues: ["Call of Cthulhu", "Call of Cthulhu 7th Edition"],
    capabilities: plannedCapabilities,
  },
  {
    id: "coriolis",
    translationKey: "coriolis",
    legacyValues: [],
    capabilities: plannedCapabilities,
  },
  {
    id: "cyberpunk-red",
    translationKey: "cyberpunkRed",
    legacyValues: [],
    capabilities: plannedCapabilities,
  },
  {
    id: "delta-green",
    translationKey: "deltaGreen",
    legacyValues: [],
    capabilities: plannedCapabilities,
  },
  {
    id: "forbidden-lands",
    translationKey: "forbiddenLands",
    legacyValues: [],
    capabilities: plannedCapabilities,
  },
  {
    id: "ironsworn",
    translationKey: "ironsworn",
    legacyValues: [],
    capabilities: plannedCapabilities,
  },
  {
    id: "mothership",
    translationKey: "mothership",
    legacyValues: [],
    capabilities: plannedCapabilities,
  },
  {
    id: "paranoia",
    translationKey: "paranoia",
    legacyValues: [],
    capabilities: plannedCapabilities,
  },
  {
    id: "traveller-mongoose",
    translationKey: "travellerMongoose",
    legacyValues: [],
    capabilities: plannedCapabilities,
  },
] as const satisfies readonly GameSystemDefinition[];

export type GameSystemCatalogueEntry =
  (typeof GAME_SYSTEM_CATALOGUE)[number];
export type GameSystemId = GameSystemCatalogueEntry["id"];
export type GameSystemTranslationKey =
  GameSystemCatalogueEntry["translationKey"];

export type GameSystemsAvailableFor<
  Capability extends GameSystemCapability,
  System = GameSystemCatalogueEntry,
> = System extends GameSystemCatalogueEntry
  ? System["capabilities"][Capability] extends AvailableCapability
    ? System
    : never
  : never;

export type AvailableCharacterCreationSystemId =
  GameSystemsAvailableFor<"characterCreation">["id"];

export const GAME_SYSTEMS_BY_ID = Object.fromEntries(
  GAME_SYSTEM_CATALOGUE.map((system) => [system.id, system]),
) as {
  [SystemId in GameSystemId]: Extract<
    GameSystemCatalogueEntry,
    { id: SystemId }
  >;
};

export function getGameSystemCatalogueEntry(
  systemId: string,
): GameSystemCatalogueEntry | null {
  return GAME_SYSTEMS_BY_ID[systemId as GameSystemId] ?? null;
}

export function hasAvailableGameSystemCapability<
  Capability extends GameSystemCapability,
>(
  system: GameSystemCatalogueEntry,
  capability: Capability,
): system is GameSystemsAvailableFor<Capability> {
  return system.capabilities[capability].status === "available";
}

export function isGameSystemCapabilityAvailable(
  systemId: string,
  capability: GameSystemCapability,
): boolean {
  return (
    getGameSystemCatalogueEntry(systemId)?.capabilities[capability].status ===
    "available"
  );
}

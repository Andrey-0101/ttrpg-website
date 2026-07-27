import {
  GAME_SYSTEM_CATALOGUE,
  GAME_SYSTEMS_BY_ID,
  getGameSystemCatalogueEntry,
  type GameSystemId,
  type GameSystemTranslationKey,
} from "../game-systems/catalogue";

export const GAME_SYSTEMS = GAME_SYSTEMS_BY_ID;
export type { GameSystemId };

export function getGameSystem(systemId: string) {
  return getGameSystemCatalogueEntry(systemId);
}

export function normalizeGameSystemId(
  value: string
): GameSystemId | null {
  const catalogueSystem = getGameSystemCatalogueEntry(value);

  if (catalogueSystem) {
    return catalogueSystem.id;
  }

  const matchedSystem = GAME_SYSTEM_CATALOGUE.find((system) =>
    system.legacyValues.some((legacyValue) => legacyValue === value)
  );

  return matchedSystem?.id ?? null;
}

export function getGameSystemTranslationKey(
  value: string,
): GameSystemTranslationKey | null {
  const normalizedId = normalizeGameSystemId(value);

  return normalizedId ? GAME_SYSTEMS[normalizedId].translationKey : null;
}

const LEGACY_FALLBACK_NAMES: Record<GameSystemId, string> = {
  "vtm-v5": "Vampire: The Masquerade V5",
  alien: "Alien",
  "black-powder-and-brimstone": "Black Powder and Brimstone",
  "call-of-cthulhu-7e": "Call of Cthulhu",
  coriolis: "Coriolis",
  "cyberpunk-red": "Cyberpunk RED",
  "delta-green": "Delta Green",
  "forbidden-lands": "Forbidden Lands",
  ironsworn: "Ironsworn",
  mothership: "Mothership",
  paranoia: "Paranoia",
  "traveller-mongoose": "Traveller (Mongoose Publishing)",
};

/**
 * Non-localized compatibility helper. User interfaces should prefer
 * getGameSystemTranslationKey with the GameSystemCatalogue messages.
 */
export function getGameSystemName(value: string) {
  const normalizedId = normalizeGameSystemId(value);

  if (!normalizedId) {
    return value;
  }

  return LEGACY_FALLBACK_NAMES[normalizedId];
}

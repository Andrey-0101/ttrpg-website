import type {
  PersonalRollerKind,
} from "./personal-dice-persistence";
import type {
  PersonalRollHistoryEntry,
} from "./personal-dice-persistence-service";

export const PERSONAL_ROLL_HISTORY_RETAINED_PER_SCOPE = 6;
export const PERSONAL_ROLL_HISTORY_VISIBLE_PREVIOUS_PER_SCOPE = 5;

type PersonalRollHistoryScope = "vtm" | "custom" | "coc";

function getHistoryScope(
  rollerKind: PersonalRollerKind,
): PersonalRollHistoryScope {
  switch (rollerKind) {
    case "vtm_v5":
      return "vtm";
    case "custom_dice_pool":
      return "custom";
    case "coc_7e_percentile":
    case "coc_7e_other_dice":
      return "coc";
  }
}

export function getPersonalRollHistoryLabel(
  entry: PersonalRollHistoryEntry,
): string | null {
  return entry.rollerKind === "vtm_v5"
    ? entry.resultData.request.label
    : entry.requestData.label ?? null;
}

export function mergePersonalRollHistoryEntry(
  entries: readonly PersonalRollHistoryEntry[],
  recordedEntry: PersonalRollHistoryEntry,
): PersonalRollHistoryEntry[] {
  const counts = new Map<PersonalRollHistoryScope, number>();

  return [
    recordedEntry,
    ...entries.filter((entry) => entry.id !== recordedEntry.id),
  ]
    .sort((left, right) => right.sequenceNumber - left.sequenceNumber)
    .filter((entry) => {
      const scope = getHistoryScope(entry.rollerKind);
      const count = counts.get(scope) ?? 0;
      counts.set(scope, count + 1);
      return count < PERSONAL_ROLL_HISTORY_RETAINED_PER_SCOPE;
    });
}

export function getVisiblePreviousRolls(
  entries: readonly PersonalRollHistoryEntry[],
  rollerKinds: readonly PersonalRollerKind[],
  currentClientRollIds: readonly string[],
): PersonalRollHistoryEntry[] {
  const allowedKinds = new Set(rollerKinds);
  const currentIds = new Set(currentClientRollIds);
  let visibleCount = 0;

  return [...entries]
    .sort((left, right) => right.sequenceNumber - left.sequenceNumber)
    .filter((entry) => {
      if (
        !allowedKinds.has(entry.rollerKind) ||
        currentIds.has(entry.clientRollId)
      ) {
        return false;
      }

      visibleCount += 1;
      return visibleCount <= PERSONAL_ROLL_HISTORY_VISIBLE_PREVIOUS_PER_SCOPE;
    });
}

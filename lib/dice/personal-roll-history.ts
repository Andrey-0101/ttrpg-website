import type {
  PersonalRollerKind,
} from "./personal-dice-persistence";
import type {
  PersonalRollHistoryEntry,
} from "./personal-dice-persistence-service";

export const PERSONAL_ROLL_HISTORY_RETAINED_PER_KIND = 6;
export const PERSONAL_ROLL_HISTORY_VISIBLE_PREVIOUS_PER_KIND = 5;

export function mergePersonalRollHistoryEntry(
  entries: readonly PersonalRollHistoryEntry[],
  recordedEntry: PersonalRollHistoryEntry,
): PersonalRollHistoryEntry[] {
  const counts = new Map<PersonalRollerKind, number>();

  return [
    recordedEntry,
    ...entries.filter((entry) => entry.id !== recordedEntry.id),
  ]
    .sort((left, right) => right.sequenceNumber - left.sequenceNumber)
    .filter((entry) => {
      const count = counts.get(entry.rollerKind) ?? 0;
      counts.set(entry.rollerKind, count + 1);
      return count < PERSONAL_ROLL_HISTORY_RETAINED_PER_KIND;
    });
}

export function getVisiblePreviousRolls(
  entries: readonly PersonalRollHistoryEntry[],
  rollerKinds: readonly PersonalRollerKind[],
  currentClientRollIds: readonly string[],
): PersonalRollHistoryEntry[] {
  const allowedKinds = new Set(rollerKinds);
  const currentIds = new Set(currentClientRollIds);
  const visibleCounts = new Map<PersonalRollerKind, number>();

  return entries.filter((entry) => {
    if (
      !allowedKinds.has(entry.rollerKind) ||
      currentIds.has(entry.clientRollId)
    ) {
      return false;
    }

    const count = visibleCounts.get(entry.rollerKind) ?? 0;
    visibleCounts.set(entry.rollerKind, count + 1);
    return count < PERSONAL_ROLL_HISTORY_VISIBLE_PREVIOUS_PER_KIND;
  });
}

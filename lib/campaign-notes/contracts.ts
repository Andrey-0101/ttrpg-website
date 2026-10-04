export const NOTE_BODY_LIMIT = 20000;
export type NoteSession = { session_number: number; title: string | null };
export type CampaignNote = {
  id: string;
  body: string;
  campaign_name_snapshot: string;
  created_at: string;
  created_timezone: string;
  edited_at: string | null;
  edited_timezone: string | null;
  game_session_id: string | null;
  game_sessions: NoteSession | null;
};
export type NotesState = { entries: CampaignNote[]; canWrite: boolean };
export type NotesResult =
  ({ ok: true } & NotesState) | { ok: false; error: string };
export type NoteMutation =
  | { action: "create"; body: string; timezone: string }
  | { action: "edit"; id: string; body: string; timezone: string }
  | { action: "delete"; id: string };
export type NotesFilter = "all" | "text" | "date" | "session";

export function validTimezone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 100) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
export function browserTimezone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return validTimezone(zone) ? zone : "UTC";
  } catch {
    return "UTC";
  }
}
export function parseNoteMutation(value: unknown): NoteMutation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const keys =
    row.action === "create"
      ? ["action", "body", "timezone"]
      : row.action === "edit"
        ? ["action", "id", "body", "timezone"]
        : row.action === "delete"
          ? ["action", "id"]
          : [];
  if (
    !keys.length ||
    Object.keys(row).length !== keys.length ||
    !keys.every((key) => key in row)
  )
    return null;
  if (
    row.action !== "create" &&
    (typeof row.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        row.id,
      ))
  )
    return null;
  if (
    row.action !== "delete" &&
    (typeof row.body !== "string" ||
      !row.body.trim() ||
      row.body.length > NOTE_BODY_LIMIT ||
      !validTimezone(row.timezone))
  )
    return null;
  return row as NoteMutation;
}
export function creationDates(
  entry: CampaignNote,
  locale: string,
): { display: string; iso: string } {
  const date = new Date(entry.created_at);
  const options = {
    timeZone: entry.created_timezone,
    year: "numeric",
    month: "long",
    day: "numeric",
  } as const;
  const parts = new Intl.DateTimeFormat("en", {
    ...options,
    month: "2-digit",
  }).formatToParts(date);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return {
    display: new Intl.DateTimeFormat(locale, options).format(date),
    iso: `${part("year")}-${part("month").padStart(2, "0")}-${part("day").padStart(2, "0")}`,
  };
}
export function formatNoteTime(
  timestamp: string,
  timezone: string,
  locale: string,
): string {
  const date = new Date(timestamp);
  return `${new Intl.DateTimeFormat(locale, { timeZone: timezone, year: "numeric", month: "long", day: "numeric" }).format(date)}, ${new Intl.DateTimeFormat(locale, { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date)}`;
}
export function sessionSubtitle(
  session: NoteSession | null,
  label: string,
): string {
  return session
    ? `${label} ${session.session_number}${session.title ? `. ${session.title}` : ""}`
    : "";
}
export function filterNotes(
  entries: CampaignNote[],
  query: string,
  filter: NotesFilter,
  locale: string,
  sessionLabel: string,
): CampaignNote[] {
  const needle = query.trim().toLocaleLowerCase(locale);
  return entries.filter((entry) => {
    if (!needle) return true;
    const dates = creationDates(entry, locale);
    const fields = {
      text: entry.body,
      date: `${dates.display} ${dates.iso}`,
      session: sessionSubtitle(entry.game_sessions, sessionLabel),
    };
    return (filter === "all" ? Object.values(fields) : [fields[filter]]).some(
      (field) => field.toLocaleLowerCase(locale).includes(needle),
    );
  });
}
export function sortNotes(entries: CampaignNote[]): CampaignNote[] {
  return [...entries].sort(
    (a, b) =>
      a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  );
}

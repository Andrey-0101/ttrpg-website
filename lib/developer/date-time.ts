// Presentation only: use the Developer browser's default timezone, not telemetry time anchors.
const localDateTime = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function formatDeveloperDateTime(time: number): string {
  const parts = Object.fromEntries(
    localDateTime.formatToParts(time).map(({ type, value }) => [type, value]),
  );
  return `${parts.day} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute}:${parts.second}`;
}

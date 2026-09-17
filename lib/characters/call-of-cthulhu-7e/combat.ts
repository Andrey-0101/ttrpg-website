export function formatCoc7eBrawlDamage(
  damageBonus: string | null | undefined,
): string {
  if (!damageBonus || damageBonus === "none") {
    return "1D3";
  }

  if (damageBonus.startsWith("-")) {
    return `1D3 - ${damageBonus.slice(1)}`;
  }

  return `1D3 + ${damageBonus.replace(/^\+/u, "")}`;
}

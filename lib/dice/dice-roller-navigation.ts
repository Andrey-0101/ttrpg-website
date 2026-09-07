import { routing, type Locale } from "../../i18n/routing";

const FALLBACK_DICE_ROLLERS_ROUTE = "/dice-rollers";
const INTERNAL_ORIGIN = "https://internal.invalid";
const ENCODED_UNSAFE_PATH_PATTERN = /%(?:0[0-9a-f]|2f|5c|7f)/iu;
const CONTROL_OR_BACKSLASH_PATTERN = /[\u0000-\u001f\u007f\\]/u;

function isLocale(value: string): value is Locale {
  return routing.locales.includes(value as Locale);
}

export function resolveDiceRollerReturnTo(
  locale: Locale,
  value: string | string[] | undefined,
): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 2048 ||
    value.trim() !== value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    CONTROL_OR_BACKSLASH_PATTERN.test(value) ||
    ENCODED_UNSAFE_PATH_PATTERN.test(value)
  ) {
    return FALLBACK_DICE_ROLLERS_ROUTE;
  }

  let destination: URL;
  try {
    destination = new URL(value, INTERNAL_ORIGIN);
  } catch {
    return FALLBACK_DICE_ROLLERS_ROUTE;
  }

  if (destination.origin !== INTERNAL_ORIGIN) {
    return FALLBACK_DICE_ROLLERS_ROUTE;
  }

  const [firstSegment] = destination.pathname.slice(1).split("/");
  let pathname = destination.pathname;

  if (isLocale(firstSegment)) {
    if (firstSegment !== locale) {
      return FALLBACK_DICE_ROLLERS_ROUTE;
    }

    pathname = destination.pathname.slice(locale.length + 1) || "/";
  }

  return `${pathname}${destination.search}${destination.hash}`;
}

export function withDiceRollerReturnTo(
  rollerRoute: string,
  sourceRoute: string,
): string {
  const separator = rollerRoute.includes("?") ? "&" : "?";
  return `${rollerRoute}${separator}returnTo=${encodeURIComponent(sourceRoute)}`;
}

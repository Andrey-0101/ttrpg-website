import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = hasLocale(
    routing.locales,
    requestedLocale,
  )
    ? requestedLocale
    : routing.defaultLocale;

  const commonMessages = (
    await import(`../messages/${locale}.json`)
  ).default;
  const vtmV5Messages = (
    await import(`../messages/${locale}/vtm-v5.json`)
  ).default;

  return {
    locale,
    messages: {
      ...commonMessages,
      ...vtmV5Messages,
    },
  };
});

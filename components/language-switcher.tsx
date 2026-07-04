"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { requestUnsavedChangesNavigation } from "@/lib/navigation/unsaved-changes";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function changeLanguage(nextLocale: Locale) {
    if (nextLocale === locale) {
      return;
    }

    if (!requestUnsavedChangesNavigation()) {
      return;
    }

    document.documentElement.lang = nextLocale;

    router.replace(pathname, {
      locale: nextLocale,
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => changeLanguage("en")}
        disabled={locale === "en"}
        className="rounded border px-3 py-2 disabled:bg-black disabled:text-white"
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => changeLanguage("ru")}
        disabled={locale === "ru"}
        className="rounded border px-3 py-2 disabled:bg-black disabled:text-white"
      >
        RU
      </button>
    </div>
  );
}

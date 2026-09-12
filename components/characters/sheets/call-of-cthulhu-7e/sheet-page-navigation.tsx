"use client";

import { useTranslations } from "next-intl";

import type { Coc7eSheetPage } from "@/lib/characters/call-of-cthulhu-7e/editor-draft";

const PAGES: readonly Coc7eSheetPage[] = ["investigator", "story"];

export default function Coc7eSheetPageNavigation({
  activePage,
  onChange,
}: {
  activePage: Coc7eSheetPage;
  onChange: (page: Coc7eSheetPage) => void;
}) {
  const translations = useTranslations("Coc7eCharacterSheet");

  return (
    <nav
      aria-label={translations("pageNavigationLabel")}
      className="sticky top-2 z-10 grid grid-cols-2 gap-2 rounded-lg border bg-black/95 p-2 backdrop-blur"
    >
      {PAGES.map((page) => {
        const active = page === activePage;

        return (
          <button
            key={page}
            type="button"
            onClick={() => onChange(page)}
            aria-current={active ? "page" : undefined}
            className={`min-w-0 rounded border px-2 py-2 text-center text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
              active
                ? "border-white bg-white text-black"
                : "border-gray-600 text-white hover:bg-white/10"
            }`}
          >
            {translations(`pages.${page}`)}
          </button>
        );
      })}
    </nav>
  );
}

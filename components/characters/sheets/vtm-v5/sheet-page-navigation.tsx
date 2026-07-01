"use client";

import { useTranslations } from "next-intl";

import type {
  VtmV5SheetPage,
} from "@/lib/characters/vtm-v5/editor-draft";

type SheetPageNavigationProps = {
  activePage: VtmV5SheetPage;
  onChange: (page: VtmV5SheetPage) => void;
};

const PAGES: readonly VtmV5SheetPage[] = [
  "core",
  "background",
];

export default function SheetPageNavigation({
  activePage,
  onChange,
}: SheetPageNavigationProps) {
  const translations =
    useTranslations("VtmCharacterSheet");

  return (
    <nav
      aria-label={translations(
        "pageNavigationLabel",
      )}
      className="sticky top-2 z-10 grid gap-2 rounded-lg border bg-black/95 p-2 backdrop-blur sm:grid-cols-2"
    >
      {PAGES.map((page) => {
        const isActive = page === activePage;

        return (
          <button
            key={page}
            type="button"
            onClick={() => onChange(page)}
            aria-current={
              isActive ? "page" : undefined
            }
            className={[
              "rounded border px-3 py-2 text-left text-xs font-semibold transition",
              isActive
                ? "border-white bg-white text-black"
                : "border-gray-600 text-white hover:bg-white/10",
            ].join(" ")}
          >
            {translations(`pages.${page}`)}
          </button>
        );
      })}
    </nav>
  );
}

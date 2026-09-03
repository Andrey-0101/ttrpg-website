"use client";

import { useRef, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import {
  CAMPAIGN_GALLERY_CATEGORIES,
  type CampaignGalleryCategory,
} from "@/lib/campaign-handouts/contracts";

const CATEGORY_TRANSLATION_KEYS: Record<CampaignGalleryCategory, string> = {
  handout: "categories.handout",
  npc: "categories.npc",
  maps_plans: "categories.mapsPlans",
  other: "categories.other",
};

export default function CampaignGalleryTabs({
  activeCategory,
  onCategoryChange,
  panelId,
}: {
  activeCategory: CampaignGalleryCategory;
  onCategoryChange: (category: CampaignGalleryCategory) => void;
  panelId: string;
}) {
  const translations = useTranslations("CampaignHandouts");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % CAMPAIGN_GALLERY_CATEGORIES.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex =
        (index - 1 + CAMPAIGN_GALLERY_CATEGORIES.length) %
        CAMPAIGN_GALLERY_CATEGORIES.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = CAMPAIGN_GALLERY_CATEGORIES.length - 1;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    const category = CAMPAIGN_GALLERY_CATEGORIES[nextIndex];
    onCategoryChange(category);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={translations("categoryTabsLabel")}
      className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4"
    >
      {CAMPAIGN_GALLERY_CATEGORIES.map((category, index) => {
        const active = category === activeCategory;

        return (
          <button
            key={category}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`campaign-gallery-tab-${category}`}
            aria-selected={active}
            aria-controls={panelId}
            tabIndex={active ? 0 : -1}
            onClick={() => onCategoryChange(category)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`min-w-0 rounded-lg border px-3 py-3 text-sm font-semibold sm:text-base ${
              active
                ? "border-amber-200 bg-amber-100 text-amber-950 shadow-sm"
                : "border-white/30 bg-black/20 text-white hover:bg-white/10"
            }`}
          >
            <span className="flex min-w-0 items-center justify-center gap-2">
              {active && <span aria-hidden="true">✓</span>}
              <span className="min-w-0 break-words">
                {translations(CATEGORY_TRANSLATION_KEYS[category])}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

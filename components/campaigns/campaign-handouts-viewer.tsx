"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { CampaignGalleryCategory } from "@/lib/campaign-handouts/contracts";

import CampaignGalleryTabs from "./campaign-gallery-tabs";
import CampaignHandoutGallery, {
  type CampaignHandoutGalleryItem,
} from "./campaign-handout-gallery";

export default function CampaignHandoutsViewer({
  items,
}: {
  items: CampaignHandoutGalleryItem[];
}) {
  const translations = useTranslations("CampaignHandouts");
  const [activeCategory, setActiveCategory] =
    useState<CampaignGalleryCategory>("handout");
  const visibleItems = items.filter(
    (item) => item.category === activeCategory,
  );

  return (
    <div className="grid min-w-0 gap-6">
      <CampaignGalleryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        panelId="campaign-gallery-panel"
      />
      <div
        id="campaign-gallery-panel"
        role="tabpanel"
        aria-labelledby={`campaign-gallery-tab-${activeCategory}`}
        className="min-w-0"
      >
        {visibleItems.length === 0 ? (
          <section className="rounded-lg border border-dashed border-white/40 bg-black/20 p-6 text-center sm:p-8">
            <h2 className="text-2xl font-semibold">
              {translations("emptyTitle")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-white/75">
              {translations("emptyPlayerDescription")}
            </p>
          </section>
        ) : (
          <CampaignHandoutGallery items={visibleItems} />
        )}
      </div>
    </div>
  );
}

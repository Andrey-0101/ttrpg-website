"use client";

import { useTranslations } from "next-intl";

import CampaignHandoutGallery, {
  type CampaignHandoutGalleryItem,
} from "./campaign-handout-gallery";

export default function CampaignHandoutsViewer({
  items,
}: {
  items: CampaignHandoutGalleryItem[];
}) {
  const translations = useTranslations("CampaignHandouts");

  if (items.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-white/40 bg-black/20 p-6 text-center sm:p-8">
        <h2 className="text-2xl font-semibold">
          {translations("emptyTitle")}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-white/75">
          {translations("emptyPlayerDescription")}
        </p>
      </section>
    );
  }

  return <CampaignHandoutGallery items={items} />;
}

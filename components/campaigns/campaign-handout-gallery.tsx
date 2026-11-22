"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { CampaignGalleryImage } from "./campaign-gallery-image";

import type { CampaignGalleryCategory } from "@/lib/campaign-handouts/contracts";

export type CampaignHandoutGalleryItem = {
  key: string;
  displayName: string;
  category: CampaignGalleryCategory;
};

export default function CampaignHandoutGallery<
  TItem extends CampaignHandoutGalleryItem,
>({
  campaignId,
  items,
  renderCardCaption,
  renderCardFooter,
}: {
  campaignId: string;
  items: TItem[];
  renderCardCaption?: (item: TItem) => ReactNode;
  renderCardFooter?: (item: TItem) => ReactNode;
}) {
  const translations = useTranslations("CampaignHandouts");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedItem = items.find((item) => item.key === selectedItemId) ?? null;
  const openedItemKey = selectedItem?.key ?? null;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!openedItemKey) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedItemId(null);
      } else if (event.key === "Tab") {
        const buttons = lightboxRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        if (!buttons?.length) return;
        const target = event.shiftKey ? buttons.item(buttons.length - 1) : buttons.item(0);
        const boundary = event.shiftKey ? buttons.item(0) : buttons.item(buttons.length - 1);
        if (document.activeElement === boundary || !lightboxRef.current?.contains(document.activeElement)) {
          event.preventDefault();
          target.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      openerRef.current?.focus();
    };
  }, [openedItemKey]);

  function openItem(
    item: CampaignHandoutGalleryItem,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    openerRef.current = event.currentTarget;
    setSelectedItemId(item.key);
  }

  return (
    <>
      <div
        className={`grid min-w-0 items-start gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${
          renderCardFooter ? "grid-cols-1" : "grid-cols-2"
        }`}
      >
        {items.map((item, index) => (
          <article
            key={item.key}
            className="min-w-0"
          >
            <div className="min-w-0 overflow-hidden rounded-lg border border-neutral-300 bg-white text-neutral-950 shadow-sm">
            <div className="relative aspect-square overflow-hidden bg-neutral-200">
              <button
                type="button"
                onClick={(event) => openItem(item, event)}
                className="absolute inset-0 z-[1] block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
                aria-label={translations("openImage", {
                  name: item.displayName,
                })}
              />
                  <CampaignGalleryImage
                    campaignId={campaignId}
                    imageId={item.key}
                    alt={item.displayName}
                    loading={index === 0 ? "eager" : undefined}
                    sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, (min-width: 640px) 45vw, 48vw"
                    className="object-contain"
                  />
            </div>

            {renderCardCaption?.(item) ?? <h2 className="break-words border-t border-neutral-300 px-3 py-2.5 text-sm font-semibold sm:text-base">
              {item.displayName}
            </h2>}
            </div>
            {renderCardFooter?.(item)}
          </article>
        ))}
      </div>

      {selectedItem && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="campaign-handout-lightbox-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedItemId(null);
            }
          }}
        >
          <div className="flex h-full w-full max-w-7xl flex-col">
            <div className="mb-3 flex items-center justify-between gap-4 text-white">
              <h2
                id="campaign-handout-lightbox-title"
                className="min-w-0 break-words text-lg font-semibold sm:text-xl"
              >
                {selectedItem.displayName}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setSelectedItemId(null)}
                className="shrink-0 rounded border border-white/70 px-4 py-2 font-semibold hover:bg-white/10"
              >
                {translations("close")}
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              <CampaignGalleryImage
                key={selectedItem.key}
                campaignId={campaignId}
                imageId={selectedItem.key}
                alt={selectedItem.displayName}
                sizes="100vw"
                className="object-contain"
                loading="eager"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

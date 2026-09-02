"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";

export type CampaignHandoutGalleryItem = {
  key: string;
  displayName: string;
  signedUrl: string | null;
};

export default function CampaignHandoutGallery<
  TItem extends CampaignHandoutGalleryItem,
>({
  items,
  renderCardFooter,
}: {
  items: TItem[];
  renderCardFooter?: (item: TItem) => ReactNode;
}) {
  const translations = useTranslations("CampaignHandouts");
  const [selectedItem, setSelectedItem] =
    useState<CampaignHandoutGalleryItem | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedItem(null);
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      openerRef.current?.focus();
    };
  }, [selectedItem]);

  function openItem(
    item: CampaignHandoutGalleryItem,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    openerRef.current = event.currentTarget;
    setSelectedItem(item);
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
            className="min-w-0 overflow-hidden rounded-lg border border-neutral-300 bg-white text-neutral-950 shadow-sm"
          >
            {item.signedUrl ? (
              <button
                type="button"
                onClick={(event) => openItem(item, event)}
                className="group block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label={translations("openImage", {
                  name: item.displayName,
                })}
              >
                <span className="relative block aspect-square overflow-hidden bg-neutral-200">
                  <Image
                    src={item.signedUrl}
                    alt={item.displayName}
                    fill
                    unoptimized
                    loading={index === 0 ? "eager" : undefined}
                    sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, (min-width: 640px) 45vw, 48vw"
                    className="object-contain transition-opacity group-hover:opacity-95"
                  />
                </span>
              </button>
            ) : (
              <div className="flex aspect-square items-center justify-center bg-neutral-200 p-3 text-center text-sm text-neutral-600">
                {translations("imageUnavailable")}
              </div>
            )}

            <h2 className="break-words border-t border-neutral-300 px-3 py-2.5 text-sm font-semibold sm:text-base">
              {item.displayName}
            </h2>
            {renderCardFooter?.(item)}
          </article>
        ))}
      </div>

      {selectedItem?.signedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="campaign-handout-lightbox-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedItem(null);
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
                onClick={() => setSelectedItem(null)}
                className="shrink-0 rounded border border-white/70 px-4 py-2 font-semibold hover:bg-white/10"
              >
                {translations("close")}
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              <Image
                src={selectedItem.signedUrl}
                alt={selectedItem.displayName}
                fill
                unoptimized
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

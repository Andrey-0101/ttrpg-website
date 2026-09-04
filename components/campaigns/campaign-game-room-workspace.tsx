"use client";

import Image from "next/image";
import { useState, type KeyboardEvent, type PointerEvent } from "react";
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

const TOOL_BUTTON_CLASS =
  "min-h-11 min-w-0 rounded-lg border border-white/30 bg-black/20 px-2 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-45";

export type CampaignGameRoomGalleryItem = {
  key: string;
  imageId: string;
  displayName: string;
  localSignedUrl: string | null;
  category: CampaignGalleryCategory;
};

export default function CampaignGameRoomWorkspace({
  isGameMaster,
  galleryItems,
  connected,
  isPresenting,
  presentationExpanded,
  sharedPresentationUrl,
  presentationBusy,
  presentationError,
  onShareImage,
  onSetPresentationExpanded,
  onStopShare,
}: {
  isGameMaster: boolean;
  galleryItems: CampaignGameRoomGalleryItem[];
  connected: boolean;
  isPresenting: boolean;
  presentationExpanded: boolean;
  sharedPresentationUrl: string | null;
  presentationBusy: boolean;
  presentationError: boolean;
  onShareImage(imageId: string): Promise<boolean>;
  onSetPresentationExpanded(expanded: boolean): Promise<boolean>;
  onStopShare(): Promise<boolean>;
}) {
  const translations = useTranslations("CampaignGameRoom");
  const galleryTranslations = useTranslations("CampaignHandouts");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeCategory, setActiveCategory] =
    useState<CampaignGalleryCategory | null>(null);
  const [selectedImage, setSelectedImage] =
    useState<CampaignGameRoomGalleryItem | null>(null);

  const visibleItems = activeCategory
    ? galleryItems.filter((item) => item.category === activeCategory)
    : [];
  const expandedImageUrl = isGameMaster
    ? selectedImage?.localSignedUrl ?? null
    : sharedPresentationUrl;

  function closeGallery() {
    setGalleryOpen(false);
    setActiveCategory(null);
    setSelectedImage(null);
  }

  function openImage(item: CampaignGameRoomGalleryItem) {
    if (item.localSignedUrl) {
      setSelectedImage(item);
    }
  }

  async function closeSelectedImage() {
    if (isPresenting && !(await onStopShare())) return;
    setSelectedImage(null);
  }

  function handleImageKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    item: CampaignGameRoomGalleryItem,
  ) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openImage(item);
  }

  function handleImagePointerUp(
    event: PointerEvent<HTMLButtonElement>,
    item: CampaignGameRoomGalleryItem,
  ) {
    if (event.pointerType === "touch") {
      openImage(item);
    }
  }

  return (
    <div
      className="game-room-workspace min-h-0"
      data-game-room-workspace
      data-presentation-expanded={presentationExpanded ? "true" : "false"}
    >
      <section
        className="game-room-display flex min-h-48 min-w-0 overflow-hidden rounded-xl border border-white/20 bg-black/55"
        aria-labelledby="game-room-display-title"
        data-game-room-display
      >
        <h2 id="game-room-display-title" className="sr-only">
          {translations("workspace.display")}
        </h2>

        {isGameMaster && selectedImage?.localSignedUrl ? (
          <div className="relative min-h-0 w-full" data-game-room-local-image>
            <Image
              src={selectedImage.localSignedUrl}
              alt={translations("gallery.presentedImageAlt")}
              fill
              unoptimized
              sizes="(min-width: 75rem) 40vw, 100vw"
              className="object-contain"
              loading="eager"
            />
          </div>
        ) : !isGameMaster && sharedPresentationUrl ? (
          <div className="relative min-h-0 w-full" data-game-room-shared-image>
            <Image
              src={sharedPresentationUrl}
              alt={translations("gallery.presentedImageAlt")}
              fill
              unoptimized
              sizes="(min-width: 75rem) 40vw, 100vw"
              className="object-contain"
              loading="eager"
            />
          </div>
        ) : activeCategory ? (
          <div
            className="min-h-0 w-full overflow-y-auto p-3"
            data-game-room-gallery-list
          >
            {visibleItems.length === 0 ? (
              <p className="flex min-h-full items-center justify-center p-4 text-center text-sm text-white/65">
                {translations("gallery.emptyCategory")}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {visibleItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    disabled={!item.localSignedUrl}
                    onDoubleClick={() => openImage(item)}
                    onPointerUp={(event) => handleImagePointerUp(event, item)}
                    onKeyDown={(event) => handleImageKeyDown(event, item)}
                    aria-label={translations("gallery.openImage", {
                      name: item.displayName,
                    })}
                    className="flex min-h-16 min-w-0 items-center justify-center rounded-lg border border-white/25 bg-white/5 px-2 py-2 text-center text-xs font-semibold text-white/90 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-45 sm:text-sm"
                    data-game-room-gallery-item
                  >
                    <span className="line-clamp-3 min-w-0 break-words">
                      {item.displayName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </section>

      {presentationExpanded && expandedImageUrl ? (
        <section
          className="game-room-expanded-presentation relative min-h-0 min-w-0 overflow-hidden rounded-xl border border-white/20 bg-black/75"
          aria-label={translations("gallery.presentedImageAlt")}
          data-game-room-expanded-presentation
        >
          <Image
            src={expandedImageUrl}
            alt={translations("gallery.presentedImageAlt")}
            fill
            unoptimized
            sizes="(min-width: 48rem) 70vw, 100vw"
            className="object-contain"
            loading="eager"
          />
        </section>
      ) : null}

      <section
        className="min-h-14 rounded-xl border border-white/20 bg-black/65 p-2"
        aria-labelledby="game-tools-title"
        data-game-tools-panel
      >
        <h2 id="game-tools-title" className="sr-only">
          {translations("workspace.tools")}
        </h2>

        {selectedImage ? (
          <div className="grid grid-cols-3 gap-2" data-game-room-image-tools>
            <button
              type="button"
              onClick={() => void closeSelectedImage()}
              disabled={presentationBusy}
              aria-label={translations("tools.back")}
              className={TOOL_BUTTON_CLASS}
            >
              <span aria-hidden="true">&larr;</span>
            </button>
            <button
              type="button"
              disabled={!connected || presentationBusy}
              onClick={() =>
                void (isPresenting
                  ? onStopShare()
                  : onShareImage(selectedImage.imageId))
              }
              className={TOOL_BUTTON_CLASS}
            >
              {translations(
                isPresenting ? "tools.stopShare" : "tools.share",
              )}
            </button>
            <button
              type="button"
              disabled={!connected || !isPresenting || presentationBusy}
              onClick={() =>
                void onSetPresentationExpanded(!presentationExpanded)
              }
              aria-pressed={presentationExpanded}
              className={TOOL_BUTTON_CLASS}
            >
              {translations(
                presentationExpanded ? "tools.collapse" : "tools.expand",
              )}
            </button>
          </div>
        ) : galleryOpen ? (
          <div
            className="grid grid-cols-[3rem_repeat(4,minmax(0,1fr))] gap-2"
            data-game-room-gallery-tools
          >
            <button
              type="button"
              onClick={closeGallery}
              aria-label={translations("tools.back")}
              className={TOOL_BUTTON_CLASS}
            >
              <span aria-hidden="true">&larr;</span>
            </button>
            {CAMPAIGN_GALLERY_CATEGORIES.map((category) => {
              const active = category === activeCategory;

              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveCategory(category)}
                  className={`min-h-11 min-w-0 rounded-lg border px-1 py-2 text-xs font-semibold sm:px-2 sm:text-sm ${
                    active
                      ? "border-amber-200 bg-amber-100 text-amber-950 shadow-sm"
                      : "border-white/30 bg-black/20 text-white hover:bg-white/10"
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200`}
                >
                  <span className="flex min-w-0 items-center justify-center gap-1">
                    {active && <span aria-hidden="true">✓</span>}
                    <span className="min-w-0 break-words">
                      {galleryTranslations(
                        CATEGORY_TRANSLATION_KEYS[category],
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2" data-game-room-root-tools>
            <button
              type="button"
              disabled={!isGameMaster}
              onClick={() => setGalleryOpen(true)}
              className={TOOL_BUTTON_CLASS}
            >
              {translations(isGameMaster ? "tools.gallery" : "tools.display")}
            </button>
            <button type="button" disabled className={TOOL_BUTTON_CLASS}>
              {translations("tools.dice")}
            </button>
            <button type="button" disabled className={TOOL_BUTTON_CLASS}>
              {translations("tools.character")}
            </button>
          </div>
        )}
        {presentationError && (
          <p
            role="alert"
            className="mt-2 text-center text-xs font-medium text-rose-200"
          >
            {translations("gallery.presentationError")}
          </p>
        )}
      </section>
    </div>
  );
}

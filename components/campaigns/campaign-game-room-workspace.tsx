"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { useTranslations } from "next-intl";

import CampaignDiceJournalEvent from "@/components/campaigns/campaign-dice-journal-event";
import CampaignDiceRoller from "@/components/campaigns/campaign-dice-roller";
import {
  CAMPAIGN_GALLERY_CATEGORIES,
  type CampaignGalleryCategory,
} from "@/lib/campaign-handouts/contracts";
import type { GameSessionState } from "@/lib/game-sessions/contracts";

const CATEGORY_TRANSLATION_KEYS: Record<CampaignGalleryCategory, string> = {
  handout: "categories.handout",
  npc: "categories.npc",
  maps_plans: "categories.mapsPlans",
  other: "categories.other",
};

const TOOL_BUTTON_BASE_CLASS =
  "min-h-11 min-w-0 rounded-lg border px-2 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-45";
const TOOL_BUTTON_CLASS = `${TOOL_BUTTON_BASE_CLASS} border-white/30 bg-black/20 text-white hover:bg-white/10`;

function gameToolButtonClass(active: boolean) {
  return `${TOOL_BUTTON_BASE_CLASS} ${
    active
      ? "border-amber-200 bg-amber-100 text-amber-950 shadow-sm"
      : "border-white/30 bg-black/20 text-white hover:bg-white/10"
  }`;
}

export type CampaignGameRoomGalleryItem = {
  key: string;
  imageId: string;
  displayName: string;
  localSignedUrl: string | null;
  category: CampaignGalleryCategory;
};

export default function CampaignGameRoomWorkspace({
  campaignId,
  campaignGameSystem,
  isGameMaster,
  galleryItems,
  connected,
  isPresenting,
  presentationExpanded,
  sharedPresentationUrl,
  presentationBusy,
  presentationError,
  gameSession,
  sessionLoading,
  sessionBusy,
  sessionError,
  onStartSession,
  onEndSession,
  onJournalEvent,
  onShareImage,
  onSetPresentationExpanded,
  onStopShare,
}: {
  campaignId: string;
  campaignGameSystem: string;
  isGameMaster: boolean;
  galleryItems: CampaignGameRoomGalleryItem[];
  connected: boolean;
  isPresenting: boolean;
  presentationExpanded: boolean;
  sharedPresentationUrl: string | null;
  presentationBusy: boolean;
  presentationError: boolean;
  gameSession: GameSessionState;
  sessionLoading: boolean;
  sessionBusy: boolean;
  sessionError: boolean;
  onStartSession(): Promise<void>;
  onEndSession(): Promise<void>;
  onJournalEvent(event: GameSessionState["journal"][number]): void;
  onShareImage(imageId: string): Promise<boolean>;
  onSetPresentationExpanded(expanded: boolean): Promise<boolean>;
  onStopShare(): Promise<boolean>;
}) {
  const translations = useTranslations("CampaignGameRoom");
  const galleryTranslations = useTranslations("CampaignHandouts");
  const cocTranslations = useTranslations("Coc7eDiceRoller");
  const [activeTool, setActiveTool] = useState<
    "journal" | "gallery" | "dice"
  >("journal");
  const [activeCategory, setActiveCategory] =
    useState<CampaignGalleryCategory | null>(null);
  const [cocDiceMode, setCocDiceMode] = useState<"percentile" | "other">(
    "percentile",
  );
  const [selectedImage, setSelectedImage] =
    useState<CampaignGameRoomGalleryItem | null>(null);
  const journalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeTool === "journal" && gameSession.journal.length > 0) {
      journalEndRef.current?.scrollIntoView({ block: "end" });
    }
  }, [activeTool, gameSession.journal.length]);

  const visibleItems = activeCategory
    ? galleryItems.filter((item) => item.category === activeCategory)
    : [];
  const expandedImageUrl = isGameMaster
    ? selectedImage?.localSignedUrl ?? null
    : sharedPresentationUrl;

  function closeGallery() {
    setActiveTool("journal");
    setActiveCategory(null);
    setSelectedImage(null);
  }

  function openGallery() {
    setActiveCategory("handout");
    setSelectedImage(null);
    setActiveTool("gallery");
  }

  function openDice() {
    setCocDiceMode("percentile");
    setActiveTool("dice");
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

        {activeTool === "dice" ? (
          <CampaignDiceRoller
            campaignId={campaignId}
            gameSystem={campaignGameSystem}
            sessionActive={Boolean(gameSession.session)}
            cocMode={cocDiceMode}
            onJournalEvent={onJournalEvent}
          />
        ) : activeTool === "journal" ? (
          <div
            className="flex min-h-0 w-full flex-col overflow-hidden text-white"
            data-game-room-journal
          >
            <div
              className="flex shrink-0 items-center justify-between gap-3 p-4 pb-3"
              data-game-room-journal-header
            >
              <div>
                <h3 className="font-semibold">{translations("journal.title")}</h3>
                <p className="mt-1 text-sm text-white/70">
                  {translations(
                    sessionLoading
                      ? "journal.loading"
                      : gameSession.session
                        ? "journal.active"
                        : "journal.inactive",
                  )}
                </p>
              </div>
              {isGameMaster && !sessionLoading ? (
                <button
                  type="button"
                  disabled={sessionBusy}
                  onClick={() =>
                    void (gameSession.session
                      ? onEndSession()
                      : onStartSession())
                  }
                  className={TOOL_BUTTON_CLASS}
                >
                  {translations(
                    gameSession.session ? "journal.end" : "journal.start",
                  )}
                </button>
              ) : null}
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"
              data-game-room-journal-scroll
            >
              {gameSession.session && gameSession.journal.length === 0 ? (
                <p className="flex min-h-full items-center justify-center py-6 text-center text-sm text-white/65">
                  {translations("journal.empty")}
                </p>
              ) : null}
              {gameSession.journal.length > 0 ? (
                <ol className="space-y-2" data-game-room-journal-events>
                  {gameSession.journal.map((event) =>
                    event.eventKind === "campaign_dice_roll" ? (
                      <CampaignDiceJournalEvent key={event.id} event={event} />
                    ) : (
                      <li
                        key={event.id}
                        className="rounded-lg border border-white/15 bg-white/5 p-2 text-sm"
                      >
                        {event.eventKind}
                      </li>
                    ),
                  )}
                </ol>
              ) : null}
              <div ref={journalEndRef} aria-hidden="true" />
              {sessionError ? (
                <p role="alert" className="mt-3 text-sm text-rose-200">
                  {translations("journal.error")}
                </p>
              ) : null}
            </div>
          </div>
        ) : isGameMaster && selectedImage?.localSignedUrl ? (
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
          <div
            className="grid h-14 grid-cols-3 gap-2"
            data-game-room-image-tools
          >
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
        ) : activeTool === "gallery" ? (
          <div
            className="grid h-14 grid-cols-[3rem_repeat(4,minmax(0,1fr))] gap-2"
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
        ) : activeTool === "dice" &&
          campaignGameSystem === "call-of-cthulhu-7e" ? (
          <div
            className="grid h-14 grid-cols-[3rem_repeat(2,minmax(0,1fr))] gap-2"
            data-game-room-coc-dice-tools
          >
            <button
              type="button"
              onClick={() => setActiveTool("journal")}
              aria-label={translations("tools.back")}
              className={TOOL_BUTTON_CLASS}
            >
              <span aria-hidden="true">&larr;</span>
            </button>
            {(["percentile", "other"] as const).map((mode) => {
              const active = mode === cocDiceMode;

              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCocDiceMode(mode)}
                  className={gameToolButtonClass(active)}
                >
                  <span className="flex min-w-0 items-center justify-center gap-1">
                    {active ? <span aria-hidden="true">✓</span> : null}
                    <span className="min-w-0 break-words">
                      {cocTranslations(
                        mode === "percentile"
                          ? "percentile.title"
                          : "other.title",
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div
            className={`grid h-14 gap-2 ${
              activeTool === "journal"
                ? "grid-cols-4"
                : "grid-cols-[3rem_repeat(4,minmax(0,1fr))]"
            }`}
            data-game-room-tool-navigation
          >
            {activeTool !== "journal" ? (
              <button
                type="button"
                onClick={() => setActiveTool("journal")}
                aria-label={translations("tools.back")}
                className={TOOL_BUTTON_CLASS}
              >
                <span aria-hidden="true">&larr;</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setActiveTool("journal")}
              aria-pressed={activeTool === "journal"}
              className={gameToolButtonClass(activeTool === "journal")}
            >
              <span className="flex min-w-0 items-center justify-center gap-1">
                {activeTool === "journal" ? (
                  <span aria-hidden="true">✓</span>
                ) : null}
                <span className="min-w-0 break-words">
                  {translations("tools.journal")}
                </span>
              </span>
            </button>
            <button
              type="button"
              disabled={!isGameMaster}
              onClick={openGallery}
              aria-pressed={false}
              className={gameToolButtonClass(false)}
            >
              <span className="min-w-0 break-words">
                {translations("tools.gallery")}
              </span>
            </button>
            <button
              type="button"
              onClick={openDice}
              aria-pressed={activeTool === "dice"}
              className={gameToolButtonClass(activeTool === "dice")}
            >
              <span className="flex min-w-0 items-center justify-center gap-1">
                {activeTool === "dice" ? (
                  <span aria-hidden="true">✓</span>
                ) : null}
                <span className="min-w-0 break-words">
                  {translations("tools.dice")}
                </span>
              </span>
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

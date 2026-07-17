"use client";

import { useRef, useState } from "react";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";

type LinkedCharacter = {
  assignmentId: string;
  characterId: string;
  name: string;
  ownerId: string;
  ownerName: string;
  portraitUrl: string | null;
  linkedAt: string;
};

type AvailableCharacter = {
  id: string;
  name: string;
  visibility: string;
  portraitUrl: string | null;
  linkedElsewhere: boolean;
};

type CampaignCharactersPanelProps = {
  campaignId: string;
  campaignStatus: string;
  currentUserId: string;
  isGameMaster: boolean;
  createCharacterHref: string;
  initialLinkedCharacters: LinkedCharacter[];
  availableCharacters: AvailableCharacter[];
  loadError: boolean;
};

type MutationMessage = {
  kind: "status" | "success" | "error";
  text: string;
} | null;

function CharacterPortrait({
  name,
  portraitUrl,
}: {
  name: string;
  portraitUrl: string | null;
}) {
  return (
    <div className="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/20 bg-black/25 sm:h-24 sm:w-24">
      {portraitUrl ? (
        <Image
          src={portraitUrl}
          alt={name}
          fill
          unoptimized
          sizes="(min-width: 640px) 6rem, 100vw"
          className="object-cover"
        />
      ) : (
        <span className="text-3xl text-white/45" aria-hidden="true">
          ◇
        </span>
      )}
    </div>
  );
}

export default function CampaignCharactersPanel({
  campaignId,
  campaignStatus,
  currentUserId,
  isGameMaster,
  createCharacterHref,
  initialLinkedCharacters,
  availableCharacters,
  loadError,
}: CampaignCharactersPanelProps) {
  const translations = useTranslations("CampaignCharacters");
  const router = useRouter();
  const mutationLockRef = useRef(false);
  const [mutatingCharacterId, setMutatingCharacterId] = useState<string | null>(
    null,
  );
  const [message, setMessage] = useState<MutationMessage>(null);
  const isActiveCampaign = campaignStatus === "active";

  async function handleLink(character: AvailableCharacter) {
    if (
      mutationLockRef.current ||
      !isActiveCampaign ||
      character.visibility !== "campaign" ||
      character.linkedElsewhere
    ) {
      return;
    }

    mutationLockRef.current = true;
    setMutatingCharacterId(character.id);
    setMessage({
      kind: "status",
      text: translations("linkingStatus", {
        name: character.name,
      }),
    });

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("campaign_characters")
        .insert({
          campaign_id: campaignId,
          character_id: character.id,
          linked_by: currentUserId,
        })
        .select("id");

      if (error || !data || data.length !== 1) {
        console.error(error);
        setMessage({
          kind: "error",
          text: translations("linkError"),
        });
        return;
      }

      setMessage({
        kind: "success",
        text: translations("linkedStatus", {
          name: character.name,
        }),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage({
        kind: "error",
        text: translations("linkError"),
      });
    } finally {
      mutationLockRef.current = false;
      setMutatingCharacterId(null);
    }
  }

  async function handleUnlink(character: LinkedCharacter) {
    if (mutationLockRef.current || !isActiveCampaign) {
      return;
    }

    const confirmed = window.confirm(
      translations("unlinkConfirm", {
        name: character.name,
      }),
    );

    if (!confirmed) {
      return;
    }

    mutationLockRef.current = true;
    setMutatingCharacterId(character.characterId);
    setMessage({
      kind: "status",
      text: translations("unlinkingStatus", {
        name: character.name,
      }),
    });

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("campaign_characters")
        .update({
          unlinked_at: new Date().toISOString(),
        })
        .eq("id", character.assignmentId)
        .is("unlinked_at", null)
        .select("id");

      if (error || !data || data.length !== 1) {
        console.error(error);
        setMessage({
          kind: "error",
          text: translations("unlinkError"),
        });
        return;
      }

      setMessage({
        kind: "success",
        text: translations("unlinkedStatus", {
          name: character.name,
        }),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage({
        kind: "error",
        text: translations("unlinkError"),
      });
    } finally {
      mutationLockRef.current = false;
      setMutatingCharacterId(null);
    }
  }

  return (
    <section
      className="rounded-lg border border-white/25 bg-black/20 p-5 sm:p-6"
      aria-busy={mutatingCharacterId !== null}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{translations("title")}</h2>
          <p className="mt-2 max-w-3xl text-white/80">
            {isActiveCampaign
              ? translations("description")
              : translations("completedDescription")}
          </p>
        </div>

        <Link
          href={createCharacterHref}
          className="w-full shrink-0 rounded border border-white/70 px-4 py-2 text-center text-sm font-semibold hover:bg-white/10 sm:w-auto"
        >
          {translations("createCharacter")}
        </Link>
      </div>

      {loadError ? (
        <div
          className="mt-5 rounded-lg border border-red-300 bg-red-950/30 p-4 text-red-100"
          role="alert"
        >
          <p className="font-semibold">{translations("loadError")}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-3 rounded border border-red-200 px-3 py-2 text-sm font-semibold hover:bg-red-950/40"
          >
            {translations("retry")}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <h3 className="text-lg font-semibold">
              {translations("linkedTitle")}
            </h3>

            {initialLinkedCharacters.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-white/25 p-4 text-sm text-white/70">
                {translations("linkedEmpty")}
              </p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {initialLinkedCharacters.map((character) => {
                  const canUnlink =
                    isActiveCampaign &&
                    (isGameMaster || character.ownerId === currentUserId);
                  const isMutating =
                    mutatingCharacterId === character.characterId;

                  return (
                    <li
                      key={character.assignmentId}
                      className="rounded-lg border border-white/20 bg-black/20 p-4"
                    >
                      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                        <CharacterPortrait
                          name={character.name}
                          portraitUrl={character.portraitUrl}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="break-words text-lg font-semibold">
                            {character.name}
                          </p>
                          <p className="mt-1 break-words text-sm text-white/70">
                            {translations("owner", {
                              name: character.ownerName,
                            })}
                          </p>
                        </div>

                        <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                          <Link
                            href={`/campaigns/${campaignId}/characters/${character.characterId}`}
                            className="rounded border border-white/70 px-3 py-2 text-center text-sm font-semibold hover:bg-white/10"
                          >
                            {translations("open")}
                          </Link>

                          {canUnlink && (
                            <button
                              type="button"
                              onClick={() => handleUnlink(character)}
                              disabled={mutatingCharacterId !== null}
                              className="rounded border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-950/30 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isMutating
                                ? translations("unlinking")
                                : translations("unlink")}
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-7 border-t border-white/20 pt-6">
            <h3 className="text-lg font-semibold">
              {translations("yourCharactersTitle")}
            </h3>
            <p className="mt-1 text-sm text-white/70">
              {translations("yourCharactersDescription")}
            </p>

            {availableCharacters.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-white/25 p-4 text-sm text-white/70">
                {translations("availableEmpty")}
              </p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {availableCharacters.map((character) => {
                  const needsCampaignVisibility =
                    character.visibility !== "campaign";
                  const canLink =
                    isActiveCampaign &&
                    !needsCampaignVisibility &&
                    !character.linkedElsewhere;
                  const isMutating = mutatingCharacterId === character.id;

                  return (
                    <li
                      key={character.id}
                      className="rounded-lg border border-white/20 bg-black/20 p-4"
                    >
                      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                        <CharacterPortrait
                          name={character.name}
                          portraitUrl={character.portraitUrl}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="break-words text-lg font-semibold">
                            {character.name}
                          </p>
                          <p className="mt-1 text-sm text-white/70">
                            {character.linkedElsewhere
                              ? translations("linkedElsewhere")
                              : needsCampaignVisibility
                                ? translations("needsCampaignVisibility")
                                : translations("readyToLink")}
                          </p>
                        </div>

                        <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                          <Link
                            href={`/characters/${character.id}`}
                            className="rounded border border-white/70 px-3 py-2 text-center text-sm font-semibold hover:bg-white/10"
                          >
                            {needsCampaignVisibility
                              ? translations("editVisibility")
                              : translations("openOwned")}
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleLink(character)}
                            disabled={!canLink || mutatingCharacterId !== null}
                            className="rounded border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isMutating
                              ? translations("linking")
                              : translations("link")}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {message && (
        <p
          className={`mt-5 rounded border px-3 py-2 text-sm ${
            message.kind === "error"
              ? "border-red-400 bg-red-950/30 text-red-100"
              : message.kind === "success"
                ? "border-emerald-400 bg-emerald-950/30 text-emerald-100"
                : "border-blue-300 bg-blue-950/30 text-blue-100"
          }`}
          role={message.kind === "error" ? "alert" : "status"}
          aria-live={message.kind === "error" ? "assertive" : "polite"}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}

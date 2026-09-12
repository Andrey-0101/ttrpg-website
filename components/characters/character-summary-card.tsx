import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { VtmV5Identity } from "@/lib/characters/vtm-v5/schema";
import type { Coc7eIdentity } from "@/lib/characters/call-of-cthulhu-7e/schema";
import DeleteCharacterButton from "./delete-character-button";

type CharacterSummaryCardProps = {
  id: string;
  name: string;
  gameSystemName: string;
  visibility: string;
  portraitPath: string | null;
  portraitUrl: string | null;
  vtmIdentity: VtmV5Identity | null;
  cocIdentity: Coc7eIdentity | null;
};

type SummaryFieldProps = {
  label: string;
  value: string;
  className?: string;
};

function SummaryField({
  label,
  value,
  className = "",
}: SummaryFieldProps) {
  return (
    <div
      className={`flex min-w-0 flex-col items-start gap-0.5 border-neutral-400 px-2 py-1.5 sm:flex-row sm:items-center sm:gap-1.5 sm:px-3 ${className}`}
    >
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
        {label}:
      </span>
      <span className="min-w-0 break-words text-sm text-neutral-950 sm:truncate">
        {value || "—"}
      </span>
    </div>
  );
}

export default async function CharacterSummaryCard({
  id,
  name,
  gameSystemName,
  visibility,
  portraitPath,
  portraitUrl,
  vtmIdentity,
  cocIdentity,
}: CharacterSummaryCardProps) {
  const translations = await getTranslations("Characters");
  const vtmSheetTranslations = await getTranslations("VtmCharacterSheet");
  const cocSheetTranslations = await getTranslations("Coc7eCharacterSheet");

  const visibilityLabel =
    visibility === "public"
      ? translations("visibility.public")
      : visibility === "campaign"
        ? translations("visibility.campaign")
        : translations("visibility.private");

  return (
    <article className="overflow-hidden rounded-lg border border-neutral-400 bg-white text-neutral-950 shadow-sm">
      <div className="grid lg:grid-cols-[27%_73%]">
        <div className="relative flex min-h-52 items-center justify-center overflow-hidden border-b border-neutral-400 bg-neutral-100 lg:min-h-48 lg:border-r lg:border-b-0">
          {portraitUrl ? (
            <Image
              src={portraitUrl}
              alt={name}
              fill
              unoptimized
              sizes="(min-width: 1024px) 27vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="px-4 text-center">
              <div
                aria-hidden="true"
                className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full border border-neutral-400 text-2xl text-neutral-500"
              >
                ◇
              </div>
              <p className="text-sm font-medium italic text-neutral-600">
                {vtmIdentity
                  ? vtmSheetTranslations("portrait")
                  : cocSheetTranslations("portrait")}
              </p>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="border-b border-neutral-400 px-3 py-2">
            <h2 className="break-words text-xl font-bold sm:truncate">{name}</h2>
          </div>

          {vtmIdentity ? (
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="min-w-0 sm:border-r sm:border-neutral-400">
                <SummaryField
                  label={vtmSheetTranslations("chronicle")}
                  value={vtmIdentity.chronicle}
                  className="border-b"
                />
                <SummaryField
                  label={vtmSheetTranslations("concept")}
                  value={vtmIdentity.concept}
                  className="border-b"
                />
                <SummaryField
                  label={vtmSheetTranslations("ambition")}
                  value={vtmIdentity.ambition}
                  className="border-b"
                />
                <SummaryField
                  label={vtmSheetTranslations("desire")}
                  value={vtmIdentity.desire}
                />
              </div>

              <div className="min-w-0 border-t border-neutral-400 sm:border-t-0">
                <SummaryField
                  label={vtmSheetTranslations("generation")}
                  value={String(vtmIdentity.generation)}
                  className="border-b"
                />
                <SummaryField
                  label={vtmSheetTranslations("sire")}
                  value={vtmIdentity.sire}
                  className="border-b"
                />
                <SummaryField
                  label={vtmSheetTranslations("clan")}
                  value={vtmIdentity.clan}
                  className="border-b"
                />
                <SummaryField
                  label={vtmSheetTranslations("predatorType")}
                  value={vtmIdentity.predatorType}
                />
              </div>
            </div>
          ) : cocIdentity ? (
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="min-w-0 sm:border-r sm:border-neutral-400">
                <SummaryField
                  label={cocSheetTranslations("identity.occupation")}
                  value={cocIdentity.occupation}
                  className="border-b"
                />
                <SummaryField
                  label={cocSheetTranslations("identity.birthplace")}
                  value={cocIdentity.birthplace}
                  className="border-b"
                />
                <SummaryField
                  label={cocSheetTranslations("identity.residence")}
                  value={cocIdentity.residence}
                />
              </div>
              <div className="min-w-0 border-t border-neutral-400 sm:border-t-0">
                <SummaryField
                  label={cocSheetTranslations("identity.age")}
                  value={cocIdentity.age === null ? "" : String(cocIdentity.age)}
                  className="border-b"
                />
                <SummaryField
                  label={cocSheetTranslations("identity.gender")}
                  value={cocIdentity.gender}
                />
              </div>
            </div>
          ) : (
            <div className="px-3 py-6 text-sm text-neutral-600">
              {gameSystemName}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-neutral-400 bg-neutral-50 px-3 py-2">
        <div className="mb-1.5 text-xs text-neutral-700">
          <span className="font-semibold">{gameSystemName}</span>

          <span className="mx-2" aria-hidden="true">
            ·
          </span>

          <span>
            {translations("visibility.label")}: {visibilityLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 items-end gap-2">
          <Link
            href={`/characters/${id}`}
            className="w-full justify-self-start rounded border border-neutral-600 px-3 py-2 text-center text-sm hover:bg-neutral-200 sm:w-auto sm:py-1.5"
          >
            {translations("open")}
          </Link>

          <DeleteCharacterButton
            characterId={id}
            characterName={name}
            portraitPath={portraitPath}
          />
        </div>
      </div>
    </article>
  );
}

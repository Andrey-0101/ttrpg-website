import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { VtmV5Identity } from "@/lib/characters/vtm-v5/schema";
import DeleteCharacterButton from "./delete-character-button";

type CharacterSummaryCardProps = {
  id: string;
  name: string;
  gameSystemName: string;
  visibility: string;
  portraitPath: string | null;
  portraitUrl: string | null;
  identity: VtmV5Identity | null;
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
  identity,
}: CharacterSummaryCardProps) {
  const translations = await getTranslations("Characters");
  const sheetTranslations = await getTranslations("VtmCharacterSheet");

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
            <img
              src={portraitUrl}
              alt={name}
              className="absolute inset-0 h-full w-full object-cover"
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
                {sheetTranslations("portrait")}
              </p>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="border-b border-neutral-400 px-3 py-2">
            <h2 className="break-words text-xl font-bold sm:truncate">{name}</h2>
          </div>

          {identity ? (
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="min-w-0 sm:border-r sm:border-neutral-400">
                <SummaryField
                  label={sheetTranslations("chronicle")}
                  value={identity.chronicle}
                  className="border-b"
                />
                <SummaryField
                  label={sheetTranslations("concept")}
                  value={identity.concept}
                  className="border-b"
                />
                <SummaryField
                  label={sheetTranslations("ambition")}
                  value={identity.ambition}
                  className="border-b"
                />
                <SummaryField
                  label={sheetTranslations("desire")}
                  value={identity.desire}
                />
              </div>

              <div className="min-w-0 border-t border-neutral-400 sm:border-t-0">
                <SummaryField
                  label={sheetTranslations("generation")}
                  value={String(identity.generation)}
                  className="border-b"
                />
                <SummaryField
                  label={sheetTranslations("sire")}
                  value={identity.sire}
                  className="border-b"
                />
                <SummaryField
                  label={sheetTranslations("clan")}
                  value={identity.clan}
                  className="border-b"
                />
                <SummaryField
                  label={sheetTranslations("predatorType")}
                  value={identity.predatorType}
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

      <div className="flex flex-col items-stretch gap-3 border-t border-neutral-400 bg-neutral-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-2">
        <div className="text-xs text-neutral-700">
          <span className="font-semibold">{gameSystemName}</span>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <span>
            {translations("visibility.label")}: {visibilityLabel}
          </span>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <Link
            href={`/characters/${id}`}
            className="rounded border border-neutral-600 px-3 py-2 text-center text-sm hover:bg-neutral-200 sm:py-1.5"
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

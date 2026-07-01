"use client";

import { useTranslations } from "next-intl";

import type {
  VtmV5Identity,
  VtmV5SheetData,
} from "@/lib/characters/vtm-v5/schema";

type IdentitySectionProps = {
  isEditing: boolean;
  identity: VtmV5SheetData["identity"];
  onChange: (identity: VtmV5Identity) => void;
};

export default function IdentitySection({
  isEditing,
  identity,
  onChange,
}: IdentitySectionProps) {
  const translations =
    useTranslations("VtmCharacterSheet");
  const fieldStyle =
    "mt-1 w-full rounded border px-2 py-1.5 text-xs disabled:bg-gray-100 disabled:text-gray-900";

  function updateField<
    Key extends keyof VtmV5Identity,
  >(
    key: Key,
    value: VtmV5Identity[Key],
  ) {
    onChange({
      ...identity,
      [key]: value,
    });
  }

  return (
    <section className="px-4 py-3">
      <h2 className="text-xs font-bold uppercase tracking-wide">
        {translations("identityTitle")}
      </h2>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label>
          {translations("clan")}
          <input
            value={identity.clan}
            onChange={(event) =>
              updateField(
                "clan",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
            placeholder={translations(
              "clanPlaceholder",
            )}
          />
        </label>

        <label>
          {translations("concept")}
          <input
            value={identity.concept}
            onChange={(event) =>
              updateField(
                "concept",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
            placeholder={translations(
              "conceptPlaceholder",
            )}
          />
        </label>

        <label>
          {translations("predatorType")}
          <input
            value={identity.predatorType}
            onChange={(event) =>
              updateField(
                "predatorType",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
            placeholder={translations(
              "predatorTypePlaceholder",
            )}
          />
        </label>

        <label>
          {translations("chronicle")}
          <input
            value={identity.chronicle}
            onChange={(event) =>
              updateField(
                "chronicle",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
            placeholder={translations(
              "chroniclePlaceholder",
            )}
          />
        </label>

        <label>
          {translations("ambition")}
          <input
            value={identity.ambition}
            onChange={(event) =>
              updateField(
                "ambition",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
            placeholder={translations(
              "ambitionPlaceholder",
            )}
          />
        </label>

        <label>
          {translations("sire")}
          <input
            value={identity.sire}
            onChange={(event) =>
              updateField(
                "sire",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
            placeholder={translations(
              "sirePlaceholder",
            )}
          />
        </label>

        <label>
          {translations("desire")}
          <input
            value={identity.desire}
            onChange={(event) =>
              updateField(
                "desire",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
            placeholder={translations(
              "desirePlaceholder",
            )}
          />
        </label>

        <label>
          {translations("generation")}
          <select
            value={identity.generation}
            onChange={(event) =>
              updateField(
                "generation",
                Number(event.target.value),
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
          >
            {Array.from(
              { length: 13 },
              (_, index) => index + 4,
            ).map((generation) => (
              <option
                key={generation}
                value={generation}
              >
                {generation}
              </option>
            ))}
          </select>
        </label>

        <label>
          {translations("sect")}
          <input
            value={identity.sect}
            onChange={(event) =>
              updateField(
                "sect",
                event.target.value,
              )
            }
            disabled={!isEditing}
            className={fieldStyle}
            placeholder={translations(
              "sectPlaceholder",
            )}
          />
        </label>
      </div>
    </section>
  );
}

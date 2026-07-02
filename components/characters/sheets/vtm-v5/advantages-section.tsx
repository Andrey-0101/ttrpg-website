"use client";

import { useTranslations } from "next-intl";

import type {
  VtmV5Advantage,
  VtmV5AdvantageCategory,
} from "@/lib/characters/vtm-v5/schema";
import RatingDots from "./rating-dots";

type AdvantagesSectionProps = {
  isEditing: boolean;
  advantages: VtmV5Advantage[];
  onChange: (value: VtmV5Advantage[]) => void;
};

const ADVANTAGE_CATEGORIES = [
  "background",
  "merit",
  "flaw",
  "other",
] as const satisfies readonly VtmV5AdvantageCategory[];

function createAdvantageId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    "advantage",
    Date.now(),
    Math.random().toString(36).slice(2),
  ].join("-");
}

export default function AdvantagesSection({
  isEditing,
  advantages,
  onChange,
}: AdvantagesSectionProps) {
  const translations = useTranslations("VtmCharacterSheet");

  const visibleAdvantages = isEditing
    ? advantages
    : advantages.filter(
        (advantage) =>
          Boolean(advantage.name.trim()) ||
          advantage.dots > 0 ||
          Boolean(advantage.notes.trim()),
      );

  function addAdvantage() {
    onChange([
      ...advantages,
      {
        id: createAdvantageId(),
        name: "",
        dots: 0,
        category: "other",
        notes: "",
      },
    ]);
  }

  function updateAdvantage(
    id: string,
    patch: Partial<VtmV5Advantage>,
  ) {
    onChange(
      advantages.map((advantage) =>
        advantage.id === id
          ? {
              ...advantage,
              ...patch,
            }
          : advantage,
      ),
    );
  }

  function removeAdvantage(id: string) {
    onChange(advantages.filter((advantage) => advantage.id !== id));
  }

  return (
    <section className="flex min-h-full flex-col px-3 py-2">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span aria-hidden="true" />
        <h2 className="text-center text-sm font-bold">
          {translations("advantagesTitle")}
        </h2>

        {isEditing ? (
          <button
            type="button"
            onClick={addAdvantage}
            className="justify-self-end rounded border border-blue-600 bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
          >
            {translations("addAdvantage")}
          </button>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>

      {visibleAdvantages.length === 0 ? (
        <p className="mt-3 text-center text-xs text-neutral-500">
          {translations("noAdvantages")}
        </p>
      ) : (
        <div className="mt-2 divide-y divide-neutral-300">
          {visibleAdvantages.map((advantage, index) =>
            isEditing ? (
              <article key={advantage.id} className="py-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <label className="min-w-32 flex-1">
                    <span className="sr-only">
                      {translations("advantageName")}
                    </span>
                    <input
                      value={advantage.name}
                      onChange={(event) =>
                        updateAdvantage(advantage.id, {
                          name: event.target.value,
                        })
                      }
                      placeholder={translations("advantageNamePlaceholder")}
                      className="w-full border-0 border-b border-neutral-400 bg-transparent px-1 py-0.5 text-xs text-neutral-950 outline-none focus:border-neutral-900"
                    />
                  </label>

                  <label>
                    <span className="sr-only">
                      {translations("advantageCategory")}
                    </span>
                    <select
                      value={advantage.category}
                      onChange={(event) =>
                        updateAdvantage(advantage.id, {
                          category:
                            event.target.value as VtmV5AdvantageCategory,
                        })
                      }
                      className="max-w-32 rounded border border-neutral-400 bg-white px-1 py-0.5 text-[11px] text-neutral-950"
                    >
                      {ADVANTAGE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {translations(`advantageCategories.${category}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <RatingDots
                    label={
                      advantage.name ||
                      translations("unnamedAdvantage", {
                        number: index + 1,
                      })
                    }
                    value={advantage.dots}
                    minimum={0}
                    maximum={5}
                    isEditing={isEditing}
                    onChange={(dots) =>
                      updateAdvantage(advantage.id, { dots })
                    }
                    getButtonLabel={(value) =>
                      translations("setAdvantageRating", {
                        name:
                          advantage.name ||
                          translations("unnamedAdvantage", {
                            number: index + 1,
                          }),
                        value,
                      })
                    }
                  />

                  <label className="min-w-28 flex-1">
                    <span className="sr-only">
                      {translations("advantageNotes")}
                    </span>
                    <input
                      value={advantage.notes}
                      onChange={(event) =>
                        updateAdvantage(advantage.id, {
                          notes: event.target.value,
                        })
                      }
                      placeholder={translations("advantageNotesPlaceholder")}
                      className="w-full border-0 border-b border-neutral-300 bg-transparent px-1 py-0.5 text-[11px] text-neutral-950 outline-none focus:border-neutral-900"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => removeAdvantage(advantage.id)}
                    className="rounded border border-red-600 bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
                  >
                    {translations("removeAdvantage")}
                  </button>
                </div>
              </article>
            ) : (
              <article key={advantage.id} className="py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <strong className="text-xs">
                      {advantage.name ||
                        translations("unnamedAdvantage", {
                          number: index + 1,
                        })}
                    </strong>
                    <span className="ml-2 text-[10px] text-neutral-500">
                      {translations(
                        `advantageCategories.${advantage.category}`,
                      )}
                    </span>
                  </div>

                  <RatingDots
                    label={
                      advantage.name ||
                      translations("unnamedAdvantage", {
                        number: index + 1,
                      })
                    }
                    value={advantage.dots}
                    minimum={0}
                    maximum={5}
                    isEditing={false}
                    onChange={() => undefined}
                    getButtonLabel={(value) =>
                      translations("setAdvantageRating", {
                        name:
                          advantage.name ||
                          translations("unnamedAdvantage", {
                            number: index + 1,
                          }),
                        value,
                      })
                    }
                  />
                </div>

                {advantage.notes.trim() && (
                  <p className="mt-1 pl-3 text-[11px] text-neutral-600">
                    {advantage.notes}
                  </p>
                )}
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}

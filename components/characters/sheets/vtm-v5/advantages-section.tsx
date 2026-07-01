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
  const translations =
    useTranslations("VtmCharacterSheet");

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
    onChange(
      advantages.filter(
        (advantage) => advantage.id !== id,
      ),
    );
  }

  return (
    <section className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wide">
          {translations("advantagesTitle")}
        </h2>

        {isEditing && (
          <button
            type="button"
            onClick={addAdvantage}
            className="rounded border border-blue-600 bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
          >
            {translations("addAdvantage")}
          </button>
        )}
      </div>

      {visibleAdvantages.length === 0 ? (
        <p className="mt-2 text-xs text-gray-500">
          {translations("noAdvantages")}
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {visibleAdvantages.map(
            (advantage, index) =>
              isEditing ? (
                <article
                  key={advantage.id}
                  className="rounded border p-2"
                >
                  <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,0.55fr)_auto]">
                    <label className="min-w-0 text-[11px]">
                      {translations(
                        "advantageName",
                      )}
                      <input
                        value={advantage.name}
                        onChange={(event) =>
                          updateAdvantage(
                            advantage.id,
                            {
                              name: event.target.value,
                            },
                          )
                        }
                        placeholder={translations(
                          "advantageNamePlaceholder",
                        )}
                        className="mt-1 w-full rounded border px-1.5 py-1 text-xs"
                      />
                    </label>

                    <label className="min-w-0 text-[11px]">
                      {translations(
                        "advantageCategory",
                      )}
                      <select
                        value={advantage.category}
                        onChange={(event) =>
                          updateAdvantage(
                            advantage.id,
                            {
                              category:
                                event.target
                                  .value as VtmV5AdvantageCategory,
                            },
                          )
                        }
                        className="mt-1 w-full rounded border px-1.5 py-1 text-xs"
                      >
                        {ADVANTAGE_CATEGORIES.map(
                          (category) => (
                            <option
                              key={category}
                              value={category}
                            >
                              {translations(
                                `advantageCategories.${category}`,
                              )}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        removeAdvantage(
                          advantage.id,
                        )
                      }
                      className="rounded border border-red-600 bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
                    >
                      {translations(
                        "removeAdvantage",
                      )}
                    </button>
                  </div>

                  <div className="mt-2 grid items-end gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
                    <div>
                      <p className="mb-1 text-[11px] text-gray-500">
                        {translations(
                          "advantageRating",
                        )}
                      </p>

                      <RatingDots
                        label={
                          advantage.name ||
                          translations(
                            "unnamedAdvantage",
                            {
                              number: index + 1,
                            },
                          )
                        }
                        value={advantage.dots}
                        minimum={0}
                        maximum={5}
                        isEditing={isEditing}
                        onChange={(dots) =>
                          updateAdvantage(
                            advantage.id,
                            { dots },
                          )
                        }
                        getButtonLabel={(value) =>
                          translations(
                            "setAdvantageRating",
                            {
                              name:
                                advantage.name ||
                                translations(
                                  "unnamedAdvantage",
                                  {
                                    number:
                                      index + 1,
                                  },
                                ),
                              value,
                            },
                          )
                        }
                      />
                    </div>

                    <label className="min-w-0 text-[11px]">
                      {translations(
                        "advantageNotes",
                      )}
                      <input
                        value={advantage.notes}
                        onChange={(event) =>
                          updateAdvantage(
                            advantage.id,
                            {
                              notes:
                                event.target.value,
                            },
                          )
                        }
                        placeholder={translations(
                          "advantageNotesPlaceholder",
                        )}
                        className="mt-1 w-full rounded border px-1.5 py-1 text-[11px]"
                      />
                    </label>
                  </div>
                </article>
              ) : (
                <article
                  key={advantage.id}
                  className="border-b pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <strong className="text-xs">
                        {advantage.name ||
                          translations(
                            "unnamedAdvantage",
                            {
                              number: index + 1,
                            },
                          )}
                      </strong>

                      <span className="ml-2 text-[11px] text-gray-500">
                        {translations(
                          `advantageCategories.${advantage.category}`,
                        )}
                      </span>
                    </div>

                    <RatingDots
                      label={
                        advantage.name ||
                        translations(
                          "unnamedAdvantage",
                          {
                            number: index + 1,
                          },
                        )
                      }
                      value={advantage.dots}
                      minimum={0}
                      maximum={5}
                      isEditing={false}
                      onChange={() => undefined}
                      getButtonLabel={(value) =>
                        translations(
                          "setAdvantageRating",
                          {
                            name:
                              advantage.name ||
                              translations(
                                "unnamedAdvantage",
                                {
                                  number:
                                    index + 1,
                                },
                              ),
                            value,
                          },
                        )
                      }
                    />
                  </div>

                  {advantage.notes.trim() && (
                    <p className="mt-1 text-[11px] text-gray-600">
                      {advantage.notes}
                    </p>
                  )}
                </article>
              ),
          )}
        </div>
      )}

      {isEditing && (
        <p className="mt-2 text-[11px] text-gray-500">
          {translations("advantagesHelp")}
        </p>
      )}
    </section>
  );
}

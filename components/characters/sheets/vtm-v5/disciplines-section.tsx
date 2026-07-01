"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";

import type {
  VtmV5Discipline,
} from "@/lib/characters/vtm-v5/schema";
import RatingDots from "./rating-dots";

type DisciplinesSectionProps = {
  isEditing: boolean;
  disciplines: VtmV5Discipline[];
  onChange: (value: VtmV5Discipline[]) => void;
};

type CommaSeparatedInputProps = {
  value: string[];
  ariaLabel: string;
  placeholder: string;
  onChange: (value: string[]) => void;
};

function createDisciplineId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    "discipline",
    Date.now(),
    Math.random().toString(36).slice(2),
  ].join("-");
}

function parseCommaSeparated(
  value: string,
): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function CommaSeparatedInput({
  value,
  ariaLabel,
  placeholder,
  onChange,
}: CommaSeparatedInputProps) {
  const [text, setText] = useState(
    value.join(", "),
  );
  const isFocused = useRef(false);
  const serializedValue = value.join("\u0000");

  useEffect(() => {
    if (!isFocused.current) {
      setText(value.join(", "));
    }
  }, [serializedValue, value]);

  return (
    <input
      value={text}
      onFocus={() => {
        isFocused.current = true;
      }}
      onBlur={() => {
        isFocused.current = false;
        setText(
          parseCommaSeparated(text).join(", "),
        );
      }}
      onChange={(event) => {
        const nextText = event.target.value;
        setText(nextText);
        onChange(parseCommaSeparated(nextText));
      }}
      aria-label={ariaLabel}
      placeholder={placeholder}
      className="mt-1 w-full rounded border px-1.5 py-1 text-[11px]"
    />
  );
}

export default function DisciplinesSection({
  isEditing,
  disciplines,
  onChange,
}: DisciplinesSectionProps) {
  const translations =
    useTranslations("VtmCharacterSheet");

  const visibleDisciplines = isEditing
    ? disciplines
    : disciplines.filter(
        (discipline) =>
          Boolean(discipline.name.trim()) ||
          discipline.dots > 0 ||
          discipline.powers.length > 0 ||
          Boolean(discipline.notes.trim()),
      );

  function addDiscipline() {
    onChange([
      ...disciplines,
      {
        id: createDisciplineId(),
        name: "",
        dots: 0,
        powers: [],
        notes: "",
      },
    ]);
  }

  function updateDiscipline(
    id: string,
    patch: Partial<VtmV5Discipline>,
  ) {
    onChange(
      disciplines.map((discipline) =>
        discipline.id === id
          ? {
              ...discipline,
              ...patch,
            }
          : discipline,
      ),
    );
  }

  function removeDiscipline(id: string) {
    onChange(
      disciplines.filter(
        (discipline) => discipline.id !== id,
      ),
    );
  }

  return (
    <section className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wide">
          {translations("disciplinesTitle")}
        </h2>

        {isEditing && (
          <button
            type="button"
            onClick={addDiscipline}
            className="rounded border border-blue-600 bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
          >
            {translations("addDiscipline")}
          </button>
        )}
      </div>

      {visibleDisciplines.length === 0 ? (
        <p className="mt-2 text-xs text-gray-500">
          {translations("noDisciplines")}
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {visibleDisciplines.map(
            (discipline, index) =>
              isEditing ? (
                <article
                  key={discipline.id}
                  className="rounded border p-2"
                >
                  <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <label className="min-w-0 text-[11px]">
                      {translations(
                        "disciplineName",
                      )}
                      <input
                        value={discipline.name}
                        onChange={(event) =>
                          updateDiscipline(
                            discipline.id,
                            {
                              name: event.target.value,
                            },
                          )
                        }
                        placeholder={translations(
                          "disciplineNamePlaceholder",
                        )}
                        className="mt-1 w-full rounded border px-1.5 py-1 text-xs"
                      />
                    </label>

                    <div>
                      <p className="mb-1 text-[11px] text-gray-500">
                        {translations(
                          "disciplineRating",
                        )}
                      </p>
                      <RatingDots
                        label={
                          discipline.name ||
                          translations(
                            "unnamedDiscipline",
                            {
                              number: index + 1,
                            },
                          )
                        }
                        value={discipline.dots}
                        minimum={0}
                        maximum={5}
                        isEditing={isEditing}
                        onChange={(dots) =>
                          updateDiscipline(
                            discipline.id,
                            { dots },
                          )
                        }
                        getButtonLabel={(value) =>
                          translations(
                            "setDisciplineRating",
                            {
                              name:
                                discipline.name ||
                                translations(
                                  "unnamedDiscipline",
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

                    <button
                      type="button"
                      onClick={() =>
                        removeDiscipline(
                          discipline.id,
                        )
                      }
                      className="rounded border border-red-600 bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
                    >
                      {translations(
                        "removeDiscipline",
                      )}
                    </button>
                  </div>

                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <label className="min-w-0 text-[11px]">
                      {translations(
                        "disciplinePowers",
                      )}
                      <CommaSeparatedInput
                        value={discipline.powers}
                        ariaLabel={translations(
                          "disciplinePowersLabel",
                          {
                            name:
                              discipline.name ||
                              translations(
                                "unnamedDiscipline",
                                {
                                  number:
                                    index + 1,
                                },
                              ),
                          },
                        )}
                        placeholder={translations(
                          "disciplinePowersPlaceholder",
                        )}
                        onChange={(powers) =>
                          updateDiscipline(
                            discipline.id,
                            { powers },
                          )
                        }
                      />
                    </label>

                    <label className="min-w-0 text-[11px]">
                      {translations(
                        "disciplineNotes",
                      )}
                      <input
                        value={discipline.notes}
                        onChange={(event) =>
                          updateDiscipline(
                            discipline.id,
                            {
                              notes:
                                event.target.value,
                            },
                          )
                        }
                        placeholder={translations(
                          "disciplineNotesPlaceholder",
                        )}
                        className="mt-1 w-full rounded border px-1.5 py-1 text-[11px]"
                      />
                    </label>
                  </div>
                </article>
              ) : (
                <article
                  key={discipline.id}
                  className="border-b pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <strong className="min-w-0 text-xs">
                      {discipline.name ||
                        translations(
                          "unnamedDiscipline",
                          {
                            number: index + 1,
                          },
                        )}
                    </strong>

                    <RatingDots
                      label={
                        discipline.name ||
                        translations(
                          "unnamedDiscipline",
                          {
                            number: index + 1,
                          },
                        )
                      }
                      value={discipline.dots}
                      minimum={0}
                      maximum={5}
                      isEditing={false}
                      onChange={() => undefined}
                      getButtonLabel={(value) =>
                        translations(
                          "setDisciplineRating",
                          {
                            name:
                              discipline.name ||
                              translations(
                                "unnamedDiscipline",
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

                  {discipline.powers.length > 0 && (
                    <p className="mt-1 text-[11px] text-gray-600">
                      <span className="font-semibold">
                        {translations(
                          "disciplinePowers",
                        )}
                        :
                      </span>{" "}
                      {discipline.powers.join(", ")}
                    </p>
                  )}

                  {discipline.notes.trim() && (
                    <p className="mt-1 text-[11px] text-gray-600">
                      <span className="font-semibold">
                        {translations(
                          "disciplineNotes",
                        )}
                        :
                      </span>{" "}
                      {discipline.notes}
                    </p>
                  )}
                </article>
              ),
          )}
        </div>
      )}

      {isEditing && (
        <p className="mt-2 text-[11px] text-gray-500">
          {translations("disciplinesHelp")}
        </p>
      )}
    </section>
  );
}

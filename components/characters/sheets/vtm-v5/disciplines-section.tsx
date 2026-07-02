"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { VtmV5Discipline } from "@/lib/characters/vtm-v5/schema";
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

function parseCommaSeparated(value: string): string[] {
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
  const [text, setText] = useState(value.join(", "));
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
        setText(parseCommaSeparated(text).join(", "));
      }}
      onChange={(event) => {
        const nextText = event.target.value;
        setText(nextText);
        onChange(parseCommaSeparated(nextText));
      }}
      aria-label={ariaLabel}
      placeholder={placeholder}
      className="mt-0.5 w-full border-0 border-b border-neutral-400 bg-transparent px-0 py-0.5 text-[11px] text-neutral-950 outline-none placeholder:text-neutral-400"
    />
  );
}

export default function DisciplinesSection({
  isEditing,
  disciplines,
  onChange,
}: DisciplinesSectionProps) {
  const translations = useTranslations("VtmCharacterSheet");

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
      disciplines.filter((discipline) => discipline.id !== id),
    );
  }

  return (
    <section className="relative flex min-h-72 flex-col px-2 pb-3 pt-1.5 sm:px-3">
      <div className="relative flex min-h-6 items-center justify-center">
        <h2 className="text-center text-sm font-bold uppercase leading-none tracking-wide">
          {translations("disciplinesTitle")}
        </h2>

        {isEditing && (
          <button
            type="button"
            onClick={addDiscipline}
            className="absolute right-0 rounded border border-blue-600 bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
          >
            {translations("addDiscipline")}
          </button>
        )}
      </div>

      {visibleDisciplines.length === 0 ? (
        <p className="mt-4 text-center text-xs italic text-neutral-500">
          {translations("noDisciplines")}
        </p>
      ) : (
        <div className="mt-2 grid flex-1 lg:grid-cols-2">
          {visibleDisciplines.map((discipline, index) => {
            const displayName =
              discipline.name ||
              translations("unnamedDiscipline", {
                number: index + 1,
              });
            const isLeftColumn = index % 2 === 0;

            return isEditing ? (
              <article
                key={discipline.id}
                className={[
                  "min-w-0 border-b border-neutral-300 px-2 py-2 first:pt-0 sm:px-3",
                  isLeftColumn ? "lg:border-r lg:border-neutral-400" : "",
                ].join(" ")}
              >
                <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-end">
                  <label className="min-w-0 flex-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                    {translations("disciplineName")}
                    <input
                      value={discipline.name}
                      onChange={(event) =>
                        updateDiscipline(discipline.id, {
                          name: event.target.value,
                        })
                      }
                      placeholder={translations(
                        "disciplineNamePlaceholder",
                      )}
                      className="mt-0.5 w-full border-0 border-b border-neutral-500 bg-transparent px-0 py-0.5 text-xs font-semibold normal-case tracking-normal text-neutral-950 outline-none placeholder:font-normal placeholder:text-neutral-400"
                    />
                  </label>

                  <RatingDots
                    label={displayName}
                    value={discipline.dots}
                    minimum={0}
                    maximum={5}
                    isEditing={isEditing}
                    onChange={(dots) =>
                      updateDiscipline(discipline.id, { dots })
                    }
                    getButtonLabel={(value) =>
                      translations("setDisciplineRating", {
                        name: displayName,
                        value,
                      })
                    }
                  />

                  <button
                    type="button"
                    onClick={() => removeDiscipline(discipline.id)}
                    className="w-full rounded border border-red-600 bg-red-600 px-2 py-2 text-[10px] font-semibold text-white hover:bg-red-700 sm:w-auto sm:py-1"
                  >
                    {translations("removeDiscipline")}
                  </button>
                </div>

                <label className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  {translations("disciplinePowers")}
                  <CommaSeparatedInput
                    value={discipline.powers}
                    ariaLabel={translations("disciplinePowersLabel", {
                      name: displayName,
                    })}
                    placeholder={translations(
                      "disciplinePowersPlaceholder",
                    )}
                    onChange={(powers) =>
                      updateDiscipline(discipline.id, { powers })
                    }
                  />
                </label>

                <label className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  {translations("disciplineNotes")}
                  <input
                    value={discipline.notes}
                    onChange={(event) =>
                      updateDiscipline(discipline.id, {
                        notes: event.target.value,
                      })
                    }
                    placeholder={translations(
                      "disciplineNotesPlaceholder",
                    )}
                    className="mt-0.5 w-full border-0 border-b border-neutral-400 bg-transparent px-0 py-0.5 text-[11px] normal-case tracking-normal text-neutral-950 outline-none placeholder:text-neutral-400"
                  />
                </label>
              </article>
            ) : (
              <article
                key={discipline.id}
                className={[
                  "min-w-0 border-b border-neutral-300 px-2 py-2 first:pt-0 sm:px-3",
                  isLeftColumn ? "lg:border-r lg:border-neutral-400" : "",
                ].join(" ")}
              >
                <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <strong className="min-w-0 text-xs">{displayName}</strong>
                  <RatingDots
                    label={displayName}
                    value={discipline.dots}
                    minimum={0}
                    maximum={5}
                    isEditing={false}
                    onChange={() => undefined}
                    getButtonLabel={(value) =>
                      translations("setDisciplineRating", {
                        name: displayName,
                        value,
                      })
                    }
                  />
                </div>

                {discipline.powers.length > 0 && (
                  <p className="mt-1 text-[11px] leading-snug">
                    <span className="font-semibold">
                      {translations("disciplinePowers")}:
                    </span>{" "}
                    {discipline.powers.join(", ")}
                  </p>
                )}

                {discipline.notes && (
                  <p className="mt-1 text-[11px] italic leading-snug text-neutral-600">
                    {discipline.notes}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

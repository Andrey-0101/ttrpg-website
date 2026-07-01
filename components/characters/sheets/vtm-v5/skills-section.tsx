"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";

import {
  VTM_V5_SKILL_GROUPS,
  type VtmV5SheetData,
  type VtmV5SkillKey,
} from "@/lib/characters/vtm-v5/schema";
import RatingDots from "./rating-dots";

type SkillGroupKey =
  keyof typeof VTM_V5_SKILL_GROUPS;

type SkillsSectionProps = {
  isEditing: boolean;
  skills: VtmV5SheetData["skills"];
  specialties: VtmV5SheetData["skillSpecialties"];
  onSkillChange: (
    skill: VtmV5SkillKey,
    value: number,
  ) => void;
  onSpecialtiesChange: (
    skill: VtmV5SkillKey,
    values: string[],
  ) => void;
};

type SpecialtiesInputProps = {
  value: string[];
  placeholder: string;
  ariaLabel: string;
  onChange: (values: string[]) => void;
};

const SKILL_GROUP_KEYS = [
  "physical",
  "social",
  "mental",
] as const satisfies readonly SkillGroupKey[];

function parseSpecialties(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function SpecialtiesInput({
  value,
  placeholder,
  ariaLabel,
  onChange,
}: SpecialtiesInputProps) {
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
          parseSpecialties(text).join(", "),
        );
      }}
      onChange={(event) => {
        const nextText = event.target.value;
        setText(nextText);
        onChange(parseSpecialties(nextText));
      }}
      aria-label={ariaLabel}
      placeholder={placeholder}
      className="mt-1 w-full rounded border px-1.5 py-1 text-[11px]"
    />
  );
}

export default function SkillsSection({
  isEditing,
  skills,
  specialties,
  onSkillChange,
  onSpecialtiesChange,
}: SkillsSectionProps) {
  const translations =
    useTranslations("VtmCharacterSheet");

  return (
    <section className="px-4 py-3">
      <h2 className="text-xs font-bold uppercase tracking-wide">
        {translations("skillsTitle")}
      </h2>

      <div className="mt-3 grid gap-4 lg:grid-cols-3 lg:gap-6">
        {SKILL_GROUP_KEYS.map((groupKey) => (
          <div
            key={groupKey}
            className="min-w-0"
          >
            <h3 className="border-b pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {translations(
                `skillGroups.${groupKey}`,
              )}
            </h3>

            <div className="mt-2 flex flex-col gap-2">
              {VTM_V5_SKILL_GROUPS[groupKey].map(
                (skillKey) => {
                  const skillName = translations(
                    `skills.${skillKey}`,
                  );
                  const skillSpecialties =
                    specialties[skillKey] ?? [];
                  const showSpecialties =
                    isEditing ||
                    skillSpecialties.length > 0;

                  return (
                    <div
                      key={skillKey}
                      className="min-w-0"
                    >
                      <div className="flex min-h-5 min-w-0 items-center justify-between gap-2">
                        <span className="min-w-0 text-xs">
                          {skillName}
                        </span>

                        <RatingDots
                          label={skillName}
                          value={skills[skillKey]}
                          minimum={0}
                          maximum={5}
                          isEditing={isEditing}
                          onChange={(value) =>
                            onSkillChange(
                              skillKey,
                              value,
                            )
                          }
                          getButtonLabel={(value) =>
                            translations(
                              "setSkillRating",
                              {
                                name: skillName,
                                value,
                              },
                            )
                          }
                        />
                      </div>

                      {showSpecialties &&
                        (isEditing ? (
                          <SpecialtiesInput
                            value={skillSpecialties}
                            placeholder={translations(
                              "skillSpecialtiesPlaceholder",
                            )}
                            ariaLabel={translations(
                              "skillSpecialtiesLabel",
                              {
                                name: skillName,
                              },
                            )}
                            onChange={(values) =>
                              onSpecialtiesChange(
                                skillKey,
                                values,
                              )
                            }
                          />
                        ) : (
                          <p className="mt-0.5 text-[11px] text-gray-500">
                            {translations(
                              "skillSpecialties",
                            )}
                            :{" "}
                            {skillSpecialties.join(
                              ", ",
                            )}
                          </p>
                        ))}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <p className="mt-3 text-[11px] text-gray-500">
          {translations("skillsHelp")}
        </p>
      )}
    </section>
  );
}

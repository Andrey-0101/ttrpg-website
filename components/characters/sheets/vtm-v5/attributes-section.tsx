"use client";

import { useTranslations } from "next-intl";

import {
  VTM_V5_ATTRIBUTE_GROUPS,
  type VtmV5AttributeGroupKey,
} from "@/lib/characters/vtm-v5/definitions";
import type {
  VtmV5AttributeKey,
  VtmV5SheetData,
} from "@/lib/characters/vtm-v5/schema";
import RatingDots from "./rating-dots";

type AttributesSectionProps = {
  isEditing: boolean;
  attributes: VtmV5SheetData["attributes"];
  onChange: (
    attribute: VtmV5AttributeKey,
    value: number,
  ) => void;
};

const ATTRIBUTE_GROUP_KEYS = [
  "physical",
  "social",
  "mental",
] as const satisfies readonly VtmV5AttributeGroupKey[];

export default function AttributesSection({
  isEditing,
  attributes,
  onChange,
}: AttributesSectionProps) {
  const translations = useTranslations("VtmCharacterSheet");

  return (
    <section className="px-2 pb-2 pt-1.5 sm:px-3">
      <h2 className="text-center text-sm font-bold uppercase leading-none tracking-wide">
        {translations("attributesTitle")}
      </h2>

      <div className="mt-1.5 grid lg:grid-cols-3">
        {ATTRIBUTE_GROUP_KEYS.map((groupKey, groupIndex) => (
          <div
            key={groupKey}
            className={[
              "min-w-0 border-b border-neutral-300 px-0 py-2 last:border-b-0 sm:px-2 lg:border-b-0 lg:px-3 lg:py-0 lg:first:pl-0 lg:last:pr-0",
              groupIndex < ATTRIBUTE_GROUP_KEYS.length - 1
                ? "lg:border-r lg:border-neutral-400"
                : "",
            ].join(" ")}
          >
            <h3 className="mb-1 text-center text-xs font-semibold italic text-neutral-800">
              {translations(`attributeGroups.${groupKey}`)}
            </h3>

            <div className="space-y-0.5">
              {VTM_V5_ATTRIBUTE_GROUPS[groupKey].map((attributeKey) => {
                const attributeName = translations(
                  `attributes.${attributeKey}`,
                );

                return (
                  <div
                    key={attributeKey}
                    className="flex min-h-5 min-w-0 items-center justify-between gap-2"
                  >
                    <span className="min-w-0 text-xs leading-tight">
                      {attributeName}
                    </span>

                    <RatingDots
                      label={attributeName}
                      value={attributes[attributeKey]}
                      minimum={1}
                      maximum={5}
                      isEditing={isEditing}
                      onChange={(value) => onChange(attributeKey, value)}
                      getButtonLabel={(value) =>
                        translations("setRating", {
                          name: attributeName,
                          value,
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

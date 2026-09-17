"use client";

import { useTranslations } from "next-intl";

import {
  getCoc7eBuildAndDamageBonus,
  getCoc7eInsaneThreshold,
  getCoc7eMaximumHitPoints,
  getCoc7eMaximumMagicPoints,
  getCoc7eMaximumSanity,
  getCoc7eMove,
  type Coc7eSheetData,
} from "@/lib/characters/call-of-cthulhu-7e/schema";
import { DerivedValue, NumberField } from "./sheet-fields";

type ConditionKey = keyof Coc7eSheetData["conditions"];

const CONDITION_KEYS: readonly ConditionKey[] = [
  "temporaryInsanity",
  "indefiniteInsanity",
  "majorWound",
  "unconscious",
  "dying",
];

export default function Coc7eDerivedStatusSection({
  isEditing,
  sheetData,
  onChange,
}: {
  isEditing: boolean;
  sheetData: Coc7eSheetData;
  onChange: (value: Coc7eSheetData) => void;
}) {
  const translations = useTranslations("Coc7eCharacterSheet");
  const buildAndDamage = getCoc7eBuildAndDamageBonus(sheetData);

  return (
    <div className="p-2">
      <div className="grid items-start gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.45fr_1.25fr]">
        <div className="grid content-start gap-2">
          <TrackGroup
            label={translations("derived.hitPoints")}
            maximum={getCoc7eMaximumHitPoints(sheetData)}
            current={sheetData.vitals.hitPoints.current}
            isEditing={isEditing}
            onCurrentChange={(current) =>
              onChange({
                ...sheetData,
                vitals: {
                  ...sheetData.vitals,
                  hitPoints: { current },
                },
              })
            }
          />
          <TrackGroup
            label={translations("derived.magicPoints")}
            maximum={getCoc7eMaximumMagicPoints(sheetData)}
            current={sheetData.vitals.magicPoints.current}
            isEditing={isEditing}
            onCurrentChange={(current) =>
              onChange({
                ...sheetData,
                vitals: {
                  ...sheetData.vitals,
                  magicPoints: { current },
                },
              })
            }
          />
        </div>
        <DoubleTrack
          label={translations("derived.luck")}
          starting={sheetData.vitals.luck.starting}
          current={sheetData.vitals.luck.current}
          isEditing={isEditing}
          onChange={(luck) =>
            onChange({
              ...sheetData,
              vitals: { ...sheetData.vitals, luck },
            })
          }
        />
        <SanityGroup
          starting={sheetData.vitals.sanity.starting}
          current={sheetData.vitals.sanity.current}
          maximum={getCoc7eMaximumSanity(sheetData)}
          insaneThreshold={getCoc7eInsaneThreshold(sheetData)}
          isEditing={isEditing}
          onChange={(sanity) =>
            onChange({
              ...sheetData,
              vitals: { ...sheetData.vitals, sanity },
            })
          }
        />
        <div className="grid content-start grid-cols-2 gap-1 rounded border border-neutral-300 p-1.5">
          <DerivedValue label={translations("derived.move")}>
            {getCoc7eMove(sheetData)}
          </DerivedValue>
          <DerivedValue label={translations("derived.build")}>
            {buildAndDamage?.build ?? null}
          </DerivedValue>
          <DerivedValue
            label={translations("derived.damageBonus")}
            className="col-span-2"
          >
            {buildAndDamage?.damageBonus === "none"
              ? translations("derived.none")
              : (buildAndDamage?.damageBonus ?? null)}
          </DerivedValue>
        </div>
      </div>

      <fieldset className="mt-2">
        <legend className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
          {translations("conditions.title")}
        </legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {CONDITION_KEYS.map((key) => (
            <label key={key} className="flex min-h-9 items-center gap-2 rounded border border-neutral-300 px-2 py-1 text-xs">
              <input
                type="checkbox"
                checked={sheetData.conditions[key]}
                onChange={(event) =>
                  onChange({
                    ...sheetData,
                    conditions: {
                      ...sheetData.conditions,
                      [key]: event.target.checked,
                    },
                  })
                }
                disabled={!isEditing}
              />
              {translations(`conditions.${key}`)}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function SanityGroup({
  starting,
  current,
  maximum,
  insaneThreshold,
  isEditing,
  onChange,
}: {
  starting: number | null;
  current: number | null;
  maximum: number | null;
  insaneThreshold: number | null;
  isEditing: boolean;
  onChange: (value: { starting: number | null; current: number | null }) => void;
}) {
  const translations = useTranslations("Coc7eCharacterSheet");

  return (
    <fieldset className="self-start rounded border border-neutral-300 p-1.5">
      <legend className="px-1 text-xs font-bold">
        {translations("derived.sanity")}
      </legend>
      <div className="grid grid-cols-2 gap-1">
        <NumberField
          label={translations("derived.starting")}
          value={starting}
          onChange={(value) => onChange({ starting: value, current })}
          disabled={!isEditing}
          titleCaseLabel
        />
        <NumberField
          label={translations("derived.current")}
          value={current}
          onChange={(value) => onChange({ starting, current: value })}
          disabled={!isEditing}
          titleCaseLabel
        />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 border-t border-neutral-200 pt-2">
        <DerivedValue label={translations("derived.maximumSanity")}>
          {maximum}
        </DerivedValue>
        <DerivedValue label={translations("derived.insaneThreshold")}>
          {insaneThreshold}
        </DerivedValue>
      </div>
    </fieldset>
  );
}

function TrackGroup({
  label,
  maximum,
  current,
  isEditing,
  onCurrentChange,
}: {
  label: string;
  maximum: number | null;
  current: number | null;
  isEditing: boolean;
  onCurrentChange: (value: number | null) => void;
}) {
  const translations = useTranslations("Coc7eCharacterSheet");

  return (
    <fieldset className="self-start rounded border border-neutral-300 p-1.5">
      <legend className="px-1 text-xs font-bold">{label}</legend>
      <div className="grid grid-cols-2 gap-1">
        <DerivedValue label={translations("derived.maximum")}>{maximum}</DerivedValue>
        <NumberField
          label={translations("derived.current")}
          value={current}
          onChange={onCurrentChange}
          disabled={!isEditing}
          titleCaseLabel
        />
      </div>
    </fieldset>
  );
}

function DoubleTrack({
  label,
  starting,
  current,
  isEditing,
  onChange,
}: {
  label: string;
  starting: number | null;
  current: number | null;
  isEditing: boolean;
  onChange: (value: { starting: number | null; current: number | null }) => void;
}) {
  const translations = useTranslations("Coc7eCharacterSheet");

  return (
    <fieldset className="self-start rounded border border-neutral-300 p-1.5">
      <legend className="px-1 text-xs font-bold">{label}</legend>
      <div className="grid grid-cols-2 gap-1">
        <NumberField
          label={translations("derived.starting")}
          value={starting}
          onChange={(value) => onChange({ starting: value, current })}
          disabled={!isEditing}
          titleCaseLabel
        />
        <NumberField
          label={translations("derived.current")}
          value={current}
          onChange={(value) => onChange({ starting, current: value })}
          disabled={!isEditing}
          titleCaseLabel
        />
      </div>
    </fieldset>
  );
}

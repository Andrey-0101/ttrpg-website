"use client";

import { useTranslations } from "next-intl";

import {
  COC7E_CHARACTERISTIC_KEYS,
  type Coc7eCharacteristicKey,
} from "@/lib/characters/call-of-cthulhu-7e/definitions";
import {
  getCoc7eThresholds,
  type Coc7eSheetData,
} from "@/lib/characters/call-of-cthulhu-7e/schema";
import { SHEET_INPUT_CLASS } from "./sheet-fields";

export default function Coc7eCharacteristicsSection({
  isEditing,
  sheetData,
  onChange,
}: {
  isEditing: boolean;
  sheetData: Coc7eSheetData;
  onChange: (key: Coc7eCharacteristicKey, value: number | null) => void;
}) {
  const translations = useTranslations("Coc7eCharacterSheet");

  return (
    <div className="grid gap-2 p-2 sm:grid-cols-2 lg:grid-cols-4">
      {COC7E_CHARACTERISTIC_KEYS.map((key) => {
        const value = sheetData.characteristics[key];
        const thresholds = getCoc7eThresholds(value);
        const alias = key === "int" ? "idea" : key === "edu" ? "know" : null;

        return (
          <fieldset key={key} className="min-w-0 rounded border border-neutral-300 p-1.5">
            <legend className="px-1 text-xs font-bold uppercase">
              {translations(`characteristics.${key}`)}
              {alias ? (
                <span className="ml-1 font-normal text-neutral-500">
                  ({translations(`characteristics.${alias}`)})
                </span>
              ) : null}
            </legend>
            <div className="grid grid-cols-3 gap-1">
              <label>
                <span className="block text-center text-[9px] text-neutral-500">
                  {translations("thresholds.regular")}
                </span>
                <input
                  type="number"
                  min={0}
                  max={999}
                  step={1}
                  inputMode="numeric"
                  value={value ?? ""}
                  onChange={(event) => {
                    const nextValue = event.target.value.trim();
                    const parsed = Number(nextValue);
                    onChange(
                      key,
                      nextValue === "" || !Number.isInteger(parsed) || parsed < 0 || parsed > 999
                        ? null
                        : parsed,
                    );
                  }}
                  disabled={!isEditing}
                  className={`${SHEET_INPUT_CLASS} text-center tabular-nums`}
                />
              </label>
              <Threshold label={translations("thresholds.hard")} value={thresholds.hard} />
              <Threshold label={translations("thresholds.extreme")} value={thresholds.extreme} />
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

function Threshold({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <span className="block text-center text-[9px] text-neutral-500">{label}</span>
      <output className="block min-h-8 rounded-sm border border-neutral-300 bg-stone-100 px-1 py-1 text-center text-sm tabular-nums">
        {value ?? "—"}
      </output>
    </div>
  );
}

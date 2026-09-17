"use client";

import { useTranslations } from "next-intl";

import {
  COC7E_FIXED_SKILLS,
  COC7E_SKILL_COLUMNS,
  COC7E_SPECIALTY_DEFINITIONS,
  type Coc7eFixedSkillId,
  type Coc7eSpecialtyCategory,
} from "@/lib/characters/call-of-cthulhu-7e/definitions";
import {
  getCoc7eFixedSkillBase,
  getCoc7eFixedSkillValue,
  getCoc7eSpecialtyBase,
  getCoc7eSpecialtyValue,
  getCoc7eThresholds,
  type Coc7eSheetData,
  type Coc7eSkillInstance,
} from "@/lib/characters/call-of-cthulhu-7e/schema";
import {
  parseOptionalInteger,
  SHEET_EDITABLE_NUMERIC_CLASS,
  SHEET_INPUT_CLASS,
  SHEET_NUMERIC_LABEL_CLASS,
  SHEET_READONLY_NUMERIC_CLASS,
} from "./sheet-fields";

const SPECIALTIES_BY_COLUMN: readonly (readonly Coc7eSpecialtyCategory[])[] = [
  ["artCraft", "fighting", "firearms"],
  ["languageOther", "languageOwn"],
  ["pilot", "science", "survival", "custom"],
];

const SKILL_ROW_CLASS =
  "grid min-w-0 grid-cols-[1rem_minmax(0,1fr)_2.75rem_2.75rem_2.75rem] items-end gap-x-1";

export default function Coc7eSkillsSection({
  isEditing,
  sheetData,
  onChange,
}: {
  isEditing: boolean;
  sheetData: Coc7eSheetData;
  onChange: (value: Coc7eSheetData) => void;
}) {
  const translations = useTranslations("Coc7eCharacterSheet");

  function updateFixedSkill(
    id: Coc7eFixedSkillId,
    patch: Partial<Coc7eSheetData["skills"]["fixed"][Coc7eFixedSkillId]>,
  ) {
    onChange({
      ...sheetData,
      skills: {
        ...sheetData.skills,
        fixed: {
          ...sheetData.skills.fixed,
          [id]: { ...sheetData.skills.fixed[id], ...patch },
        },
      },
    });
  }

  function updateSpecialty(
    category: Coc7eSpecialtyCategory,
    index: number,
    row: Coc7eSkillInstance,
  ) {
    const rows = [...sheetData.skills.specialties[category]];
    rows[index] = row;
    onChange({
      ...sheetData,
      skills: {
        ...sheetData.skills,
        specialties: {
          ...sheetData.skills.specialties,
          [category]: rows,
        },
      },
    });
  }

  return (
    <div className="grid min-w-0 gap-3 p-2 lg:grid-cols-3 lg:gap-2">
      {COC7E_SKILL_COLUMNS.map((skillIds, columnIndex) => (
        <div key={columnIndex} className="min-w-0 space-y-1.5">
          {skillIds.map((id) => {
            const definition = COC7E_FIXED_SKILLS.find((skill) => skill.id === id)!;
            const state = sheetData.skills.fixed[id];
            const baseValue = getCoc7eFixedSkillBase(sheetData, id);

            return (
              <SkillRow
                key={id}
                label={translations(`skills.fixed.${id}`)}
                baseValue={baseValue}
                developmentMarked={state.developmentMarked}
                developmentAllowed={definition.developmentAllowed}
                isEditing={isEditing}
                onValueChange={(value) => updateFixedSkill(id, { value })}
                onDevelopmentChange={(developmentMarked) =>
                  updateFixedSkill(id, { developmentMarked })
                }
                effectiveValue={getCoc7eFixedSkillValue(sheetData, id)}
              />
            );
          })}

          {SPECIALTIES_BY_COLUMN[columnIndex].map((category) => {
            const definition = COC7E_SPECIALTY_DEFINITIONS.find(
              (item) => item.category === category,
            )!;

            return (
              <fieldset key={category} className="mt-2 rounded border border-neutral-300 p-1.5">
                <legend className="px-1 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                  {translations(`skills.specialties.${category}`)}
                </legend>
                <div className="space-y-1.5">
                  {sheetData.skills.specialties[category].map((row, index) => {
                    const effectiveValue = getCoc7eSpecialtyValue(
                      sheetData,
                      category,
                      row,
                    );
                    const requiresName =
                      row.value !== null ||
                      row.developmentMarked ||
                      (definition.baseValue === null && row.baseValue !== null);

                    return (
                      <SpecialtyRow
                        key={row.id}
                        row={row}
                        category={category}
                        baseValue={getCoc7eSpecialtyBase(sheetData, category, row)}
                        variableBase={definition.baseValue === null}
                        effectiveValue={effectiveValue}
                        isEditing={isEditing}
                        requiresName={requiresName}
                        onChange={(nextRow) => updateSpecialty(category, index, nextRow)}
                      />
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function SkillRow({
  label,
  baseValue,
  developmentMarked,
  developmentAllowed,
  isEditing,
  onValueChange,
  onDevelopmentChange,
  effectiveValue,
}: {
  label: string;
  baseValue: number | null;
  developmentMarked: boolean;
  developmentAllowed: boolean;
  isEditing: boolean;
  onValueChange: (value: number | null) => void;
  onDevelopmentChange: (value: boolean) => void;
  effectiveValue: number | null;
}) {
  const translations = useTranslations("Coc7eCharacterSheet");
  const thresholds = getCoc7eThresholds(effectiveValue);

  return (
    <div className={SKILL_ROW_CLASS}>
      {developmentAllowed ? (
        <input
          type="checkbox"
          checked={developmentMarked}
          onChange={(event) => onDevelopmentChange(event.target.checked)}
          disabled={!isEditing}
          aria-label={translations("skills.developmentMark", { skill: label })}
          className="mb-2 justify-self-center"
        />
      ) : (
        <span aria-hidden="true" />
      )}
      <SkillNameAndBase label={label} baseValue={baseValue} />
      <RegularValueCell
        label={translations("thresholds.regularShort")}
        ariaLabel={`${label}: ${translations("thresholds.regular")}`}
        value={effectiveValue}
        disabled={!isEditing}
        onChange={onValueChange}
      />
      <ThresholdCell label={translations("thresholds.hardShort")} value={thresholds.hard} />
      <ThresholdCell label={translations("thresholds.extremeShort")} value={thresholds.extreme} />
    </div>
  );
}

function SpecialtyRow({
  row,
  category,
  baseValue,
  variableBase,
  effectiveValue,
  isEditing,
  requiresName,
  onChange,
}: {
  row: Coc7eSkillInstance;
  category: Coc7eSpecialtyCategory;
  baseValue: number | null;
  variableBase: boolean;
  effectiveValue: number | null;
  isEditing: boolean;
  requiresName: boolean;
  onChange: (value: Coc7eSkillInstance) => void;
}) {
  const translations = useTranslations("Coc7eCharacterSheet");
  const thresholds = getCoc7eThresholds(effectiveValue);

  return (
    <div className={`${SKILL_ROW_CLASS} gap-y-1`}>
      <input
        type="checkbox"
        checked={row.developmentMarked}
        onChange={(event) => onChange({ ...row, developmentMarked: event.target.checked })}
        disabled={!isEditing}
        aria-label={translations("skills.developmentMark", {
          skill: row.specialty || translations(`skills.specialties.${category}`),
        })}
        className="col-start-1 row-start-2 mb-2 justify-self-center"
      />
      <label
        className={`col-start-2 row-start-1 min-w-0 ${
          variableBase ? "col-span-3" : "col-span-4"
        }`}
      >
        <span className="sr-only">{translations("skills.specialtyName")}</span>
        <input
          value={row.specialty}
          onChange={(event) => onChange({ ...row, specialty: event.target.value })}
          disabled={!isEditing}
          required={requiresName}
          placeholder={translations(`skills.specialties.${category}`)}
          className={`${SHEET_INPUT_CLASS} h-8 text-[11px]`}
        />
      </label>
      {variableBase ? (
        <label className="col-start-5 row-start-1">
          <span className={SHEET_NUMERIC_LABEL_CLASS}>
            {translations("skills.baseShort")}
          </span>
          <input
            type="number"
            min={0}
            max={999}
            step={1}
            inputMode="numeric"
            value={row.baseValue ?? ""}
            onChange={(event) =>
              onChange({ ...row, baseValue: parseOptionalInteger(event.target.value) })
            }
            disabled={!isEditing}
            aria-label={translations("skills.base")}
            className={SHEET_EDITABLE_NUMERIC_CLASS}
          />
        </label>
      ) : null}
      <span className="col-start-2 row-start-2 self-center text-[10px] font-medium leading-tight text-neutral-500">
        {!variableBase && baseValue !== null ? `${baseValue}%` : ""}
      </span>
      <RegularValueCell
        label={translations("thresholds.regularShort")}
        ariaLabel={translations("skills.regularValue", {
          skill: row.specialty || translations(`skills.specialties.${category}`),
        })}
        value={effectiveValue}
        disabled={!isEditing}
        onChange={(value) => onChange({ ...row, value })}
        className="col-start-3 row-start-2"
      />
      <ThresholdCell
        label={translations("thresholds.hardShort")}
        value={thresholds.hard}
        className="col-start-4 row-start-2"
      />
      <ThresholdCell
        label={translations("thresholds.extremeShort")}
        value={thresholds.extreme}
        className="col-start-5 row-start-2"
      />
    </div>
  );
}

function RegularValueCell({
  label,
  ariaLabel,
  value,
  disabled,
  onChange,
  className = "",
}: {
  label: string;
  ariaLabel: string;
  value: number | null;
  disabled: boolean;
  onChange: (value: number | null) => void;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className={SHEET_NUMERIC_LABEL_CLASS}>{label}</span>
      <input
        type="number"
        min={0}
        max={999}
        step={1}
        inputMode="numeric"
        value={value ?? ""}
        onChange={(event) => onChange(parseOptionalInteger(event.target.value))}
        disabled={disabled}
        aria-label={ariaLabel}
        className={SHEET_EDITABLE_NUMERIC_CLASS}
      />
    </label>
  );
}

function ThresholdCell({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className={SHEET_NUMERIC_LABEL_CLASS}>{label}</span>
      <output className={SHEET_READONLY_NUMERIC_CLASS}>
        {value ?? "—"}
      </output>
    </div>
  );
}

function SkillNameAndBase({
  label,
  baseValue,
}: {
  label: string;
  baseValue: number | null;
}) {
  const parenthetical = /^(.*?)\s+(\([^()]+\))$/u.exec(label);
  const percentage = baseValue === null ? null : `${baseValue}%`;

  return (
    <div className="min-w-0 self-center text-[11px] font-medium leading-4">
      {parenthetical ? (
        <>
          <span className="block">{parenthetical[1]}</span>
          <span className="block text-[10px] tracking-tight">
            {parenthetical[2]}{" "}
            {percentage ? (
              <span className="whitespace-nowrap text-neutral-500">
                {percentage}
              </span>
            ) : null}
          </span>
        </>
      ) : (
        <span className="block whitespace-normal break-words">
          {label}{" "}
          {percentage ? (
            <span className="whitespace-nowrap text-neutral-500">
              {percentage}
            </span>
          ) : null}
        </span>
      )}
    </div>
  );
}

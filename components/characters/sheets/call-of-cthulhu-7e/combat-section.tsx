"use client";

import { useTranslations } from "next-intl";

import {
  COC7E_FIXED_SKILL_IDS,
  COC7E_SPECIALTY_CATEGORIES,
} from "@/lib/characters/call-of-cthulhu-7e/definitions";
import {
  getCoc7eFixedSkillValue,
  getCoc7eSpecialtyValue,
  getCoc7eThresholds,
  type Coc7eSheetData,
  type Coc7eWeaponRow,
} from "@/lib/characters/call-of-cthulhu-7e/schema";
import { parseOptionalInteger, SHEET_INPUT_CLASS } from "./sheet-fields";

type SkillOption = {
  id: string;
  label: string;
  value: number | null;
};

export default function Coc7eCombatSection({
  isEditing,
  sheetData,
  onChange,
}: {
  isEditing: boolean;
  sheetData: Coc7eSheetData;
  onChange: (value: Coc7eSheetData) => void;
}) {
  const translations = useTranslations("Coc7eCharacterSheet");
  const skillOptions: SkillOption[] = [
    ...COC7E_FIXED_SKILL_IDS.map((id) => ({
      id,
      label: translations(`skills.fixed.${id}`),
      value: getCoc7eFixedSkillValue(sheetData, id),
    })),
    ...COC7E_SPECIALTY_CATEGORIES.flatMap((category) =>
      sheetData.skills.specialties[category].flatMap((row) =>
        row.specialty.trim()
          ? [{
              id: row.id,
              label: row.specialty,
              value: getCoc7eSpecialtyValue(sheetData, category, row),
            }]
          : [],
      ),
    ),
  ];
  const optionsById = new Map(skillOptions.map((option) => [option.id, option]));
  const brawl = getCoc7eThresholds(
    getCoc7eFixedSkillValue(sheetData, "fightingBrawl"),
  );

  function updateWeapon(index: number, value: Coc7eWeaponRow) {
    const weapons = [...sheetData.weapons];
    weapons[index] = value;
    onChange({ ...sheetData, weapons });
  }

  return (
    <div className="p-2">
      <div className="hidden grid-cols-[1.25fr_1.4fr_repeat(3,3rem)_1fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-1 px-1 text-center text-[9px] font-semibold uppercase text-neutral-600 lg:grid">
        <span>{translations("combat.weapon")}</span>
        <span>{translations("combat.skill")}</span>
        <span>{translations("thresholds.regularShort")}</span>
        <span>{translations("thresholds.hardShort")}</span>
        <span>{translations("thresholds.extremeShort")}</span>
        <span>{translations("combat.damage")}</span>
        <span>{translations("combat.attacks")}</span>
        <span>{translations("combat.range")}</span>
        <span>{translations("combat.ammo")}</span>
        <span>{translations("combat.malfunction")}</span>
      </div>

      <div className="mt-1 grid grid-cols-2 gap-1 rounded border border-neutral-300 bg-stone-100 p-1 text-xs sm:grid-cols-5 lg:grid-cols-[1.25fr_1.4fr_repeat(3,3rem)_1fr_0.7fr_0.7fr_0.8fr_0.8fr]">
        <CombatValue label={translations("combat.weapon")} value={translations("combat.brawl")} />
        <CombatValue label={translations("combat.skill")} value={translations("skills.fixed.fightingBrawl")} />
        <CombatValue label={translations("thresholds.regular")} value={brawl.regular} />
        <CombatValue label={translations("thresholds.hard")} value={brawl.hard} />
        <CombatValue label={translations("thresholds.extreme")} value={brawl.extreme} />
        <CombatValue label={translations("combat.damage")} value="1D3 + DB" />
        <CombatValue label={translations("combat.attacks")} value="1" />
        <CombatValue label={translations("combat.range")} value="—" />
        <CombatValue label={translations("combat.ammo")} value="—" />
        <CombatValue label={translations("combat.malfunction")} value="—" />
      </div>

      <div className="mt-2 space-y-2">
        {sheetData.weapons.map((weapon, index) => {
          const customSkill = weapon.skill.kind === "custom" ? weapon.skill : null;
          const linkedOption =
            weapon.skill.kind === "linked"
              ? optionsById.get(weapon.skill.skillId)
              : null;
          const skillValue =
            weapon.skill.kind === "linked"
              ? (linkedOption?.value ?? null)
              : weapon.skill.value;
          const thresholds = getCoc7eThresholds(skillValue);

          return (
            <div
              key={weapon.id}
              className="grid grid-cols-2 gap-1 rounded border border-neutral-300 p-1 sm:grid-cols-5 lg:grid-cols-[1.25fr_1.4fr_repeat(3,3rem)_1fr_0.7fr_0.7fr_0.8fr_0.8fr]"
            >
              <CombatInput label={translations("combat.weapon")} value={weapon.weapon} disabled={!isEditing} onChange={(value) => updateWeapon(index, { ...weapon, weapon: value })} />
              <div className="col-span-2 grid gap-1 sm:col-span-1">
                <label>
                  <span className="block text-[9px] font-semibold uppercase text-neutral-500 lg:sr-only">{translations("combat.skillSource")}</span>
                  <select
                    value={weapon.skill.kind === "linked" ? weapon.skill.skillId : ""}
                    onChange={(event) =>
                      updateWeapon(index, {
                        ...weapon,
                        skill: event.target.value
                          ? { kind: "linked", skillId: event.target.value }
                          : { kind: "custom", name: "", value: null },
                      })
                    }
                    disabled={!isEditing}
                    className={`${SHEET_INPUT_CLASS} text-[11px]`}
                  >
                    <option value="">{translations("combat.customSkill")}</option>
                    {skillOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </label>
                {customSkill ? (
                  <div className="grid grid-cols-[minmax(0,1fr)_4rem] gap-1">
                    <input
                      value={customSkill.name}
                      onChange={(event) => updateWeapon(index, { ...weapon, skill: { kind: "custom", name: event.target.value, value: customSkill.value } })}
                      disabled={!isEditing}
                      required={customSkill.value !== null}
                      aria-label={translations("combat.customSkillName")}
                      placeholder={translations("combat.customSkillName")}
                      className={`${SHEET_INPUT_CLASS} text-[11px]`}
                    />
                    <input
                      type="number"
                      min={0}
                      max={999}
                      step={1}
                      value={customSkill.value ?? ""}
                      onChange={(event) => updateWeapon(index, { ...weapon, skill: { kind: "custom", name: customSkill.name, value: parseOptionalInteger(event.target.value) } })}
                      disabled={!isEditing}
                      aria-label={translations("thresholds.regular")}
                      className={`${SHEET_INPUT_CLASS} text-center tabular-nums`}
                    />
                  </div>
                ) : null}
              </div>
              <CombatValue label={translations("thresholds.regular")} value={thresholds.regular} />
              <CombatValue label={translations("thresholds.hard")} value={thresholds.hard} />
              <CombatValue label={translations("thresholds.extreme")} value={thresholds.extreme} />
              <CombatInput label={translations("combat.damage")} value={weapon.damage} disabled={!isEditing} onChange={(value) => updateWeapon(index, { ...weapon, damage: value })} />
              <CombatInput label={translations("combat.attacks")} value={weapon.attacks} disabled={!isEditing} onChange={(value) => updateWeapon(index, { ...weapon, attacks: value })} />
              <CombatInput label={translations("combat.range")} value={weapon.range} disabled={!isEditing} onChange={(value) => updateWeapon(index, { ...weapon, range: value })} />
              <CombatInput label={translations("combat.ammo")} value={weapon.ammo} disabled={!isEditing} onChange={(value) => updateWeapon(index, { ...weapon, ammo: value })} />
              <CombatInput label={translations("combat.malfunction")} value={weapon.malfunction} disabled={!isEditing} onChange={(value) => updateWeapon(index, { ...weapon, malfunction: value })} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CombatInput({ label, value, disabled, onChange }: { label: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <label className="min-w-0">
      <span className="block text-[9px] font-semibold uppercase text-neutral-500 lg:sr-only">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={`${SHEET_INPUT_CLASS} text-[11px]`} />
    </label>
  );
}

function CombatValue({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="min-w-0">
      <span className="block text-[9px] font-semibold uppercase text-neutral-500 lg:sr-only">{label}</span>
      <output className="block min-h-8 truncate rounded-sm border border-neutral-300 bg-stone-100 px-1 py-1 text-center text-xs tabular-nums" title={String(value ?? "")}>
        {value ?? "—"}
      </output>
    </div>
  );
}

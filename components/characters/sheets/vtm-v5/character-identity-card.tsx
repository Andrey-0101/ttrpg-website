"use client";

import { useTranslations } from "next-intl";

import type {
  VtmV5Identity,
  VtmV5SheetData,
} from "@/lib/characters/vtm-v5/schema";

type CharacterIdentityCardProps = {
  isEditing: boolean;
  name: string;
  identity: VtmV5SheetData["identity"];
  onNameChange: (value: string) => void;
  onIdentityChange: (value: VtmV5Identity) => void;
};

type TextIdentityKey = Exclude<keyof VtmV5Identity, "generation">;

type IdentityTextFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  className?: string;
};

const cellClassName =
  "min-w-0 border-neutral-400 px-2 py-1.5 sm:px-3 sm:py-1.5";

const labelClassName =
  "shrink-0 text-[10px] font-semibold uppercase tracking-wide text-neutral-500";

const inputClassName =
  "min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-tight text-neutral-950 outline-none placeholder:text-neutral-400 disabled:cursor-default disabled:opacity-100";

function IdentityTextField({
  label,
  value,
  placeholder,
  isEditing,
  onChange,
  className = "",
}: IdentityTextFieldProps) {
  return (
    <label
      className={`${cellClassName} flex items-center gap-1.5 ${className}`}
    >
      <span className={labelClassName}>{label}:</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={!isEditing}
        className={inputClassName}
        placeholder={placeholder}
      />
    </label>
  );
}

export default function CharacterIdentityCard({
  isEditing,
  name,
  identity,
  onNameChange,
  onIdentityChange,
}: CharacterIdentityCardProps) {
  const sheetTranslations = useTranslations("VtmCharacterSheet");

  function updateTextField(key: TextIdentityKey, value: string) {
    onIdentityChange({
      ...identity,
      [key]: value,
    });
  }

  return (
    <section className="overflow-hidden border border-neutral-400 bg-white text-neutral-950">
      <div className="grid md:grid-cols-[27%_73%]">
        <div className="flex min-h-36 items-center justify-center border-b border-neutral-400 bg-neutral-100 px-4 text-center md:min-h-44 md:border-r md:border-b-0">
          <div>
            <div
              aria-hidden="true"
              className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full border border-neutral-400 text-2xl text-neutral-500"
            >
              ◇
            </div>
            <p className="text-sm font-medium italic text-neutral-600">
              {sheetTranslations("portrait")}
            </p>
          </div>
        </div>

        <div>
          <label className="flex min-w-0 items-center gap-2 border-b border-neutral-400 px-3 py-1.5">
            <span className={labelClassName}>
              {sheetTranslations("name")}:
            </span>
            <input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              disabled={!isEditing}
              required
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-lg font-bold leading-tight text-neutral-950 outline-none placeholder:text-neutral-400 disabled:cursor-default disabled:opacity-100 sm:text-xl"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="min-w-0 sm:border-r sm:border-neutral-400">
              <IdentityTextField
                label={sheetTranslations("chronicle")}
                value={identity.chronicle}
                placeholder={sheetTranslations("chroniclePlaceholder")}
                isEditing={isEditing}
                onChange={(value) => updateTextField("chronicle", value)}
                className="border-b border-neutral-400"
              />

              <IdentityTextField
                label={sheetTranslations("concept")}
                value={identity.concept}
                placeholder={sheetTranslations("conceptPlaceholder")}
                isEditing={isEditing}
                onChange={(value) => updateTextField("concept", value)}
                className="border-b border-neutral-400"
              />

              <IdentityTextField
                label={sheetTranslations("ambition")}
                value={identity.ambition}
                placeholder={sheetTranslations("ambitionPlaceholder")}
                isEditing={isEditing}
                onChange={(value) => updateTextField("ambition", value)}
                className="border-b border-neutral-400"
              />

              <IdentityTextField
                label={sheetTranslations("desire")}
                value={identity.desire}
                placeholder={sheetTranslations("desirePlaceholder")}
                isEditing={isEditing}
                onChange={(value) => updateTextField("desire", value)}
              />
            </div>

            <div className="min-w-0">
              <label
                className={`${cellClassName} flex items-center gap-1.5 border-b border-neutral-400`}
              >
                <span className={labelClassName}>
                  {sheetTranslations("generation")}:
                </span>
                <select
                  value={identity.generation}
                  onChange={(event) =>
                    onIdentityChange({
                      ...identity,
                      generation: Number(event.target.value),
                    })
                  }
                  disabled={!isEditing}
                  className={`${inputClassName} appearance-none`}
                >
                  {Array.from({ length: 13 }, (_, index) => index + 4).map(
                    (generation) => (
                      <option key={generation} value={generation}>
                        {generation}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <IdentityTextField
                label={sheetTranslations("sire")}
                value={identity.sire}
                placeholder={sheetTranslations("sirePlaceholder")}
                isEditing={isEditing}
                onChange={(value) => updateTextField("sire", value)}
                className="border-b border-neutral-400"
              />

              <IdentityTextField
                label={sheetTranslations("clan")}
                value={identity.clan}
                placeholder={sheetTranslations("clanPlaceholder")}
                isEditing={isEditing}
                onChange={(value) => updateTextField("clan", value)}
                className="border-b border-neutral-400"
              />

              <IdentityTextField
                label={sheetTranslations("predatorType")}
                value={identity.predatorType}
                placeholder={sheetTranslations("predatorTypePlaceholder")}
                isEditing={isEditing}
                onChange={(value) => updateTextField("predatorType", value)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useTranslations } from "next-intl";

import type {
  VtmV5Biography,
  VtmV5SheetData,
} from "@/lib/characters/vtm-v5/schema";

type BiographySectionProps = {
  isEditing: boolean;
  biography: VtmV5SheetData["biography"];
  onChange: (biography: VtmV5Biography) => void;
  className?: string;
};

type InlineFieldProps = {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  className?: string;
};

function InlineField({
  label,
  value,
  isEditing,
  onChange,
  className = "",
}: InlineFieldProps) {
  return (
    <label
      className={`grid min-h-7 grid-cols-[minmax(7.5rem,42%)_minmax(0,1fr)] items-center border-b border-neutral-400 px-2 ${className}`}
    >
      <span className="text-xs">{label}</span>
      {isEditing ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 border-0 bg-transparent px-1 py-0.5 text-xs text-neutral-950 outline-none focus:bg-neutral-50"
        />
      ) : (
        <span className="min-w-0 truncate px-1 text-xs">{value || "—"}</span>
      )}
    </label>
  );
}

type TextAreaFieldProps = {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  minHeightClass: string;
};

function TextAreaField({
  label,
  value,
  isEditing,
  onChange,
  minHeightClass,
}: TextAreaFieldProps) {
  return (
    <label className="block border-b border-neutral-400 px-2 pt-1">
      <span className="text-xs">{label}</span>
      {isEditing ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${minHeightClass} w-full resize-y border-0 bg-transparent px-0 py-1 text-xs leading-relaxed text-neutral-950 outline-none focus:bg-neutral-50`}
        />
      ) : (
        <p
          className={`${minHeightClass} whitespace-pre-wrap py-1 text-xs leading-relaxed`}
        >
          {value.trim() || "—"}
        </p>
      )}
    </label>
  );
}

export default function BiographySection({
  isEditing,
  biography,
  onChange,
  className = "",
}: BiographySectionProps) {
  const translations = useTranslations("VtmCharacterSheet");

  function updateField<Key extends keyof VtmV5Biography>(
    key: Key,
    value: VtmV5Biography[Key],
  ) {
    onChange({
      ...biography,
      [key]: value,
    });
  }

  return (
    <section className={className}>
      <div className="grid grid-cols-2">
        <InlineField
          label={translations("trueAge")}
          value={biography.trueAge}
          isEditing={isEditing}
          onChange={(value) => updateField("trueAge", value)}
          className="border-r border-neutral-400"
        />
        <InlineField
          label={translations("apparentAge")}
          value={biography.apparentAge}
          isEditing={isEditing}
          onChange={(value) => updateField("apparentAge", value)}
        />
      </div>

      <InlineField
        label={translations("dateOfBirth")}
        value={biography.dateOfBirth}
        isEditing={isEditing}
        onChange={(value) => updateField("dateOfBirth", value)}
      />
      <InlineField
        label={translations("dateOfDeath")}
        value={biography.dateOfDeath}
        isEditing={isEditing}
        onChange={(value) => updateField("dateOfDeath", value)}
      />

      <TextAreaField
        label={translations("appearance")}
        value={biography.appearance}
        isEditing={isEditing}
        onChange={(value) => updateField("appearance", value)}
        minHeightClass="min-h-20"
      />
      <TextAreaField
        label={translations("distinguishingFeatures")}
        value={biography.distinguishingFeatures}
        isEditing={isEditing}
        onChange={(value) => updateField("distinguishingFeatures", value)}
        minHeightClass="min-h-24"
      />
      <TextAreaField
        label={translations("history")}
        value={biography.history}
        isEditing={isEditing}
        onChange={(value) => updateField("history", value)}
        minHeightClass="min-h-40"
      />
    </section>
  );
}

"use client";

import { useTranslations } from "next-intl";

import SharedCharacterPortraitField from "../character-portrait-field";

type CharacterPortraitFieldProps = {
  isEditing: boolean;
  portraitUrl: string | null;
  hasPortrait: boolean;
  busy?: boolean;
  onFileChange?: (file: File) => void;
  onRemove?: () => void;
};

export default function CharacterPortraitField({
  isEditing,
  portraitUrl,
  hasPortrait,
  busy = false,
  onFileChange,
  onRemove,
}: CharacterPortraitFieldProps) {
  const translations = useTranslations("VtmCharacterSheet");

  return (
    <SharedCharacterPortraitField
      isEditing={isEditing}
      portraitUrl={portraitUrl}
      hasPortrait={hasPortrait}
      busy={busy}
      onFileChange={onFileChange}
      onRemove={onRemove}
      labels={{
        portrait: translations("portrait"),
        upload: translations("uploadPortrait"),
        replace: translations("replacePortrait"),
        remove: translations("removePortrait"),
        help: translations("portraitHelp"),
        invalidType: translations("portraitInvalidType"),
        tooLarge: translations("portraitTooLarge"),
      }}
    />
  );
}

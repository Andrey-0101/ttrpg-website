"use client";

import { useTranslations } from "next-intl";

import SharedCharacterPortraitField from "../character-portrait-field";
import type { Coc7eIdentity } from "@/lib/characters/call-of-cthulhu-7e/schema";
import { NumberField, TextField } from "./sheet-fields";

export default function Coc7eIdentitySection({
  isEditing,
  name,
  identity,
  portraitUrl,
  hasPortrait,
  portraitBusy = false,
  onNameChange,
  onIdentityChange,
  onPortraitFileChange,
  onPortraitRemove,
}: {
  isEditing: boolean;
  name: string;
  identity: Coc7eIdentity;
  portraitUrl: string | null;
  hasPortrait: boolean;
  portraitBusy?: boolean;
  onNameChange: (value: string) => void;
  onIdentityChange: (value: Coc7eIdentity) => void;
  onPortraitFileChange?: (file: File) => void;
  onPortraitRemove?: () => void;
}) {
  const translations = useTranslations("Coc7eCharacterSheet");

  return (
    <section className="overflow-hidden border border-neutral-400 bg-white">
      <div className="grid lg:grid-cols-[27%_73%]">
        <SharedCharacterPortraitField
          isEditing={isEditing}
          portraitUrl={portraitUrl}
          hasPortrait={hasPortrait}
          busy={portraitBusy}
          onFileChange={onPortraitFileChange}
          onRemove={onPortraitRemove}
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

        <div className="grid content-start gap-2 p-2 sm:grid-cols-2 sm:p-3">
          <TextField
            label={translations("identity.name")}
            value={name}
            onChange={onNameChange}
            disabled={!isEditing}
            required
            className="sm:col-span-2"
          />
          <TextField
            label={translations("identity.occupation")}
            value={identity.occupation}
            onChange={(occupation) =>
              onIdentityChange({ ...identity, occupation })
            }
            disabled={!isEditing}
          />
          <TextField
            label={translations("identity.birthplace")}
            value={identity.birthplace}
            onChange={(birthplace) =>
              onIdentityChange({ ...identity, birthplace })
            }
            disabled={!isEditing}
          />
          <TextField
            label={translations("identity.residence")}
            value={identity.residence}
            onChange={(residence) =>
              onIdentityChange({ ...identity, residence })
            }
            disabled={!isEditing}
          />
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label={translations("identity.age")}
              value={identity.age}
              onChange={(age) => onIdentityChange({ ...identity, age })}
              disabled={!isEditing}
            />
            <TextField
              label={translations("identity.gender")}
              value={identity.gender}
              onChange={(gender) => onIdentityChange({ ...identity, gender })}
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

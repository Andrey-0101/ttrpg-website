"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";

import {
  CHARACTER_PORTRAIT_ACCEPT,
  validateCharacterPortraitFile,
} from "@/lib/characters/portrait";

type CharacterPortraitLabels = {
  portrait: string;
  upload: string;
  replace: string;
  remove: string;
  help: string;
  invalidType: string;
  tooLarge: string;
};

type CharacterPortraitFieldProps = {
  isEditing: boolean;
  portraitUrl: string | null;
  hasPortrait: boolean;
  labels: CharacterPortraitLabels;
  busy?: boolean;
  onFileChange?: (file: File) => void;
  onRemove?: () => void;
};

export default function CharacterPortraitField({
  isEditing,
  portraitUrl,
  hasPortrait,
  labels,
  busy = false,
  onFileChange,
  onRemove,
}: CharacterPortraitFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateCharacterPortraitFile(file);
    if (validationError) {
      setError(
        validationError === "invalidType" ? labels.invalidType : labels.tooLarge,
      );
      event.target.value = "";
      return;
    }

    setError(null);
    onFileChange?.(file);
    event.target.value = "";
  }

  function handleRemove() {
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onRemove?.();
  }

  return (
    <div className="relative flex h-full min-h-48 flex-col items-center justify-center overflow-hidden border-b border-neutral-400 bg-neutral-100 text-center lg:min-h-44 lg:border-r lg:border-b-0">
      {portraitUrl ? (
        <Image
          src={portraitUrl}
          alt={labels.portrait}
          fill
          unoptimized
          sizes="(min-width: 1024px) 27vw, 100vw"
          className="object-cover"
        />
      ) : (
        <div className="px-4">
          <div
            aria-hidden="true"
            className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full border border-neutral-400 text-2xl text-neutral-500"
          >
            ◇
          </div>
          <p className="text-sm font-medium italic text-neutral-600">
            {labels.portrait}
          </p>
        </div>
      )}

      {isEditing ? (
        <div className="relative z-10 mt-auto w-full bg-white/90 px-2 py-2 backdrop-blur-sm">
          <div className="grid w-full grid-cols-1 gap-1.5 sm:flex sm:flex-wrap sm:justify-center">
            <label
              className={`w-full rounded border border-blue-600 bg-blue-600 px-2 py-2 text-center text-[11px] font-semibold text-white sm:w-auto sm:py-1 ${
                busy
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:bg-blue-700"
              }`}
            >
              {hasPortrait ? labels.replace : labels.upload}
              <input
                ref={inputRef}
                type="file"
                accept={CHARACTER_PORTRAIT_ACCEPT}
                onChange={handleFileChange}
                disabled={busy}
                className="sr-only"
              />
            </label>

            {hasPortrait ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={busy}
                className="w-full rounded border border-red-600 bg-red-600 px-2 py-2 text-[11px] font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-1"
              >
                {labels.remove}
              </button>
            ) : null}
          </div>

          <p className="mt-1 text-[10px] leading-tight text-neutral-600">
            {labels.help}
          </p>

          {error ? (
            <p className="mt-1 text-[10px] leading-tight text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";

type ShortDescriptionFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const MAX_LINES = 2;
const MAX_CHARACTERS_PER_LINE = 50;
const MAX_CHARACTERS =
  MAX_LINES * MAX_CHARACTERS_PER_LINE;

function limitShortDescription(value: string) {
  const normalizedValue = value.replace(
    /\r\n/g,
    "\n"
  );

  const sourceLines = normalizedValue.split("\n");
  const resultLines: string[] = [];

  for (const sourceLine of sourceLines) {
    let remainingText = sourceLine;

    while (
      remainingText.length >
        MAX_CHARACTERS_PER_LINE &&
      resultLines.length < MAX_LINES
    ) {
      resultLines.push(
        remainingText.slice(
          0,
          MAX_CHARACTERS_PER_LINE
        )
      );

      remainingText = remainingText.slice(
        MAX_CHARACTERS_PER_LINE
      );
    }

    if (resultLines.length < MAX_LINES) {
      resultLines.push(
        remainingText.slice(
          0,
          MAX_CHARACTERS_PER_LINE
        )
      );
    }

    if (resultLines.length === MAX_LINES) {
      break;
    }
  }

  return resultLines
    .slice(0, MAX_LINES)
    .join("\n");
}

export default function ShortDescriptionField({
  value,
  onChange,
  disabled = false,
}: ShortDescriptionFieldProps) {
  const translations =
    useTranslations("ShortDescription");

  const characterCount = value.replace(
    /\n/g,
    ""
  ).length;

  return (
    <label>
      {translations("label")}

      <textarea
        value={value}
        onChange={(event) =>
          onChange(
            limitShortDescription(
              event.target.value
            )
          )
        }
        disabled={disabled}
        rows={MAX_LINES}
        className="mt-1 w-full resize-none rounded border p-3 disabled:bg-gray-100 disabled:text-gray-900"
        placeholder={translations("placeholder")}
      />

      <span className="mt-1 block text-sm text-gray-500">
        {translations("counter", {
          count: characterCount,
          maximum: MAX_CHARACTERS,
          lines: MAX_LINES,
          perLine: MAX_CHARACTERS_PER_LINE,
        })}
      </span>
    </label>
  );
}
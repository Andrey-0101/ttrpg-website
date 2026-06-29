"use client";

type ShortDescriptionFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const MAX_LINES = 2;
const MAX_CHARACTERS_PER_LINE = 50;

function limitShortDescription(value: string) {
  const normalizedValue = value.replace(/\r\n/g, "\n");
  const sourceLines = normalizedValue.split("\n");
  const resultLines: string[] = [];

  for (const sourceLine of sourceLines) {
    let remainingText = sourceLine;

    while (
      remainingText.length > MAX_CHARACTERS_PER_LINE &&
      resultLines.length < MAX_LINES
    ) {
      resultLines.push(
        remainingText.slice(0, MAX_CHARACTERS_PER_LINE)
      );

      remainingText = remainingText.slice(
        MAX_CHARACTERS_PER_LINE
      );
    }

    if (resultLines.length < MAX_LINES) {
      resultLines.push(
        remainingText.slice(0, MAX_CHARACTERS_PER_LINE)
      );
    }

    if (resultLines.length === MAX_LINES) {
      break;
    }
  }

  return resultLines.slice(0, MAX_LINES).join("\n");
}

export default function ShortDescriptionField({
  value,
  onChange,
  disabled = false,
}: ShortDescriptionFieldProps) {
  const characterCount = value.replace(/\n/g, "").length;

  return (
    <label>
      Short Description

      <textarea
        value={value}
        onChange={(event) =>
          onChange(limitShortDescription(event.target.value))
        }
        disabled={disabled}
        rows={2}
        className="mt-1 w-full resize-none rounded border p-3 disabled:bg-gray-100 disabled:text-gray-900"
        placeholder="A short description shown on the character card."
      />

      <span className="mt-1 block text-sm text-gray-500">
        {characterCount}/100 characters. Maximum 2 lines,
        50 characters per line.
      </span>
    </label>
  );
}
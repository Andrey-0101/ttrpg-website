"use client";

import type { ChangeEventHandler, ReactNode } from "react";

export function parseOptionalInteger(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 999
    ? parsed
    : null;
}

export const SHEET_INPUT_CLASS =
  "min-w-0 w-full rounded-sm border border-neutral-400 bg-white px-1.5 py-1 text-sm text-neutral-950 outline-none focus:border-black focus:ring-1 focus:ring-black disabled:cursor-default disabled:bg-transparent disabled:opacity-100";

export function TextField({
  label,
  value,
  onChange,
  disabled,
  required = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`min-w-0 ${className}`}>
      <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        className={SHEET_INPUT_CLASS}
      />
    </label>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  disabled,
  className = "",
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled: boolean;
  className?: string;
}) {
  return (
    <label className={`min-w-0 ${className}`}>
      <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
        {label}
      </span>
      <input
        type="number"
        min={0}
        max={999}
        step={1}
        inputMode="numeric"
        value={value ?? ""}
        onChange={(event) => onChange(parseOptionalInteger(event.target.value))}
        disabled={disabled}
        className={`${SHEET_INPUT_CLASS} tabular-nums`}
      />
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  disabled,
  rows = 4,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  rows?: number;
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-col ${className}`}>
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-700">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={rows}
        className={`${SHEET_INPUT_CLASS} min-h-24 flex-1 resize-y leading-relaxed`}
      />
    </label>
  );
}

export function DerivedValue({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
        {label}
      </span>
      <output className="block min-h-8 rounded-sm border border-neutral-400 bg-stone-100 px-1.5 py-1 text-sm tabular-nums">
        {children ?? "—"}
      </output>
    </div>
  );
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="bg-stone-800 px-3 py-1.5 text-center text-xs font-bold uppercase tracking-[0.16em] text-white sm:text-sm">
      {children}
    </h2>
  );
}

export type InputChangeHandler = ChangeEventHandler<HTMLInputElement>;

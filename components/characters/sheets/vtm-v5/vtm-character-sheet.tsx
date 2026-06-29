"use client";

type VtmCharacterSheetProps = {
  isEditing: boolean;
  clan: string;
  hunger: number;
  onClanChange: (value: string) => void;
  onHungerChange: (value: number) => void;
};

export default function VtmCharacterSheet({
  isEditing,
  clan,
  hunger,
  onClanChange,
  onHungerChange,
}: VtmCharacterSheetProps) {
  const fieldStyle =
    "mt-1 w-full rounded border p-3 disabled:bg-gray-100 disabled:text-gray-900";

  return (
    <section className="mt-8 rounded-lg border p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label>
          Clan
          <input
            value={clan}
            onChange={(event) => onClanChange(event.target.value)}
            disabled={!isEditing}
            className={fieldStyle}
            placeholder="For example: Tremere"
          />
        </label>

        <label>
          Hunger
          <select
            value={hunger}
            onChange={(event) =>
              onHungerChange(Number(event.target.value))
            }
            disabled={!isEditing}
            className={fieldStyle}
          >
            {[0, 1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
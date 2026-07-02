"use client";

type RatingDotsProps = {
  label: string;
  value: number;
  minimum?: number;
  maximum?: number;
  isEditing: boolean;
  onChange: (value: number) => void;
  getButtonLabel: (value: number) => string;
};

export default function RatingDots({
  label,
  value,
  minimum = 0,
  maximum = 5,
  isEditing,
  onChange,
  getButtonLabel,
}: RatingDotsProps) {
  const ratings = Array.from(
    { length: maximum },
    (_, index) => index + 1,
  );

  return (
    <div
      className="flex shrink-0 items-center gap-0.5"
      role="group"
      aria-label={label}
    >
      {ratings.map((rating) => {
        const isFilled = rating <= value;
        const nextValue =
          minimum === 0 && value === rating
            ? 0
            : rating;

        return (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(nextValue)}
            disabled={!isEditing}
            aria-label={getButtonLabel(nextValue)}
            aria-pressed={value === rating}
            className="flex h-8 w-8 items-center justify-center rounded-full p-0.5 disabled:cursor-default lg:h-auto lg:w-auto"
          >
            <span
              aria-hidden="true"
              className={[
                "block h-3.5 w-3.5 rounded-full border lg:h-3 lg:w-3",
                isFilled
                  ? "border-current bg-current"
                  : "border-gray-500 bg-transparent",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}

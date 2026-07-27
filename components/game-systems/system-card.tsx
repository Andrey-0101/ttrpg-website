import { Link } from "@/i18n/navigation";

type SystemCardProps = {
  name: string;
  description: string;
  status: "available" | "planned";
  availableLabel: string;
  plannedLabel: string;
  headingLevel?: 2 | 3;
  action?: {
    href: string;
    label: string;
  };
};

export default function SystemCard({
  name,
  description,
  status,
  availableLabel,
  plannedLabel,
  headingLevel = 2,
  action,
}: SystemCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const isAvailable = status === "available";

  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-white/25 bg-black/20 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Heading className="min-w-0 break-words text-xl font-bold">
          {name}
        </Heading>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-sm font-semibold ${
            isAvailable
              ? "border-green-300/40 bg-green-950/40 text-green-100"
              : "border-amber-200/40 bg-amber-950/40 text-amber-100"
          }`}
        >
          {isAvailable ? availableLabel : plannedLabel}
        </span>
      </div>

      <p className="mt-3 flex-1 break-words text-white/75">{description}</p>

      {isAvailable && action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex w-fit rounded-lg bg-white px-5 py-3 font-bold text-neutral-950 outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        >
          {action.label}
        </Link>
      )}
    </article>
  );
}

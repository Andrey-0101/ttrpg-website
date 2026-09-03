import { Link } from "@/i18n/navigation";

type CampaignHandoutsCardProps = {
  campaignId: string;
  title: string;
  description: string;
  countLabel: string;
  accessibleCount: number;
  openLabel: string;
};

export default function CampaignHandoutsCard({
  campaignId,
  title,
  description,
  countLabel,
  accessibleCount,
  openLabel,
}: CampaignHandoutsCardProps) {
  return (
    <section className="rounded-lg border border-amber-200/35 bg-amber-950/20 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold">{title}</h2>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
              {countLabel}: {accessibleCount}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-white/80 sm:text-base">
            {description}
          </p>
        </div>
        <Link
          href={`/campaigns/${campaignId}/gallery`}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded border border-amber-200 px-4 py-2 font-semibold text-amber-50 hover:bg-amber-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
        >
          {openLabel}
        </Link>
      </div>
    </section>
  );
}

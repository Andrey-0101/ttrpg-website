import { Link } from "@/i18n/navigation";

type CampaignGameRoomCardProps = {
  campaignId: string;
  campaignActive: boolean;
  title: string;
  description: string;
  availableLabel: string;
  unavailableLabel: string;
  openLabel: string;
  unavailableHelp: string;
};

export default function CampaignGameRoomCard({
  campaignId,
  campaignActive,
  title,
  description,
  availableLabel,
  unavailableLabel,
  openLabel,
  unavailableHelp,
}: CampaignGameRoomCardProps) {
  return (
    <section className="rounded-lg border border-cyan-200/35 bg-cyan-950/20 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold">{title}</h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                campaignActive
                  ? "bg-emerald-100 text-emerald-950"
                  : "bg-white/15 text-white/70"
              }`}
            >
              {campaignActive ? availableLabel : unavailableLabel}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-white/80 sm:text-base">
            {description}
          </p>
          {!campaignActive && (
            <p className="mt-2 text-sm text-white/65">{unavailableHelp}</p>
          )}
        </div>
        {campaignActive && (
          <Link
            href={`/campaigns/${campaignId}/game-room`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded border border-cyan-200 px-4 py-2 font-semibold text-cyan-50 hover:bg-cyan-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
          >
            {openLabel}
          </Link>
        )}
      </div>
    </section>
  );
}

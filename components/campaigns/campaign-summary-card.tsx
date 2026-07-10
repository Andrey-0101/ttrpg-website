import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getGameSystemName } from "@/lib/characters/game-systems";

type CampaignSummaryCardProps = {
  id: string;
  name: string;
  description: string | null;
  gameSystem: string;
  status: string;
  isGameMaster: boolean;
};

export default async function CampaignSummaryCard({
  id,
  name,
  description,
  gameSystem,
  status,
  isGameMaster,
}: CampaignSummaryCardProps) {
  const translations = await getTranslations("Campaigns");
  const statusLabel =
    status === "completed"
      ? translations("status.completed")
      : translations("status.active");
  const roleLabel = isGameMaster
    ? translations("role.gameMaster")
    : translations("role.player");

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-neutral-400 bg-white text-neutral-950 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-neutral-300 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-bold">{name}</h2>
          <p className="mt-2 break-words text-sm text-neutral-700">
            {description?.trim() || translations("noDescription")}
          </p>
        </div>

        <span
          className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            status === "completed"
              ? "bg-neutral-200 text-neutral-700"
              : "bg-emerald-100 text-emerald-900"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="grid gap-px bg-neutral-300 sm:grid-cols-2">
        <div className="min-w-0 bg-neutral-50 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {translations("gameSystemLabel")}
          </p>
          <p className="mt-1 break-words font-medium">
            {getGameSystemName(gameSystem)}
          </p>
        </div>

        <div className="min-w-0 bg-neutral-50 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {translations("roleLabel")}
          </p>
          <p className="mt-1 break-words font-medium">{roleLabel}</p>
        </div>
      </div>

      <div className="mt-auto border-t border-neutral-300 bg-neutral-50 px-5 py-3">
        <Link
          href={`/campaigns/${id}`}
          className="inline-block w-full rounded border border-neutral-700 px-4 py-2 text-center font-medium hover:bg-neutral-200 sm:w-auto"
        >
          {translations("open")}
        </Link>
      </div>
    </article>
  );
}

import { getTranslations } from "next-intl/server";

import AccountArea from "@/components/account/account-area";
import LanguageSwitcher from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";

type CampaignGameRoomHeaderProps = {
  campaignId: string;
};

type CampaignGameRoomHeaderFrameProps = CampaignGameRoomHeaderProps & {
  account: React.ReactNode;
  backLabel: string;
};

export function CampaignGameRoomHeaderFrame({
  account,
  backLabel,
  campaignId,
}: CampaignGameRoomHeaderFrameProps) {
  return (
    <header
      className="game-room-header border-b border-white/25 bg-[#210609]"
      data-game-room-header
    >
      <div className="mx-auto flex h-full min-h-16 w-full max-w-[1920px] items-center gap-2 px-3 sm:gap-5 sm:px-5 lg:px-7">
        <Link
          href="/"
          className="shrink-0 rounded px-1 text-lg font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 sm:text-xl"
        >
          TTRPG Hub
        </Link>
        <Link
          href={`/campaigns/${campaignId}`}
          className="min-w-0 truncate rounded px-1 text-sm font-medium text-white/85 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 sm:text-base"
        >
          <span aria-hidden="true">&larr;</span>
          <span className="ml-2">{backLabel}</span>
        </Link>
        <div className="shrink-0" data-game-room-header-actions />
        <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-3">
          <div className="min-w-0 max-w-28 sm:max-w-56 [&_summary]:truncate">
            {account}
          </div>
          <div className="shrink-0 [&_button]:px-2 sm:[&_button]:px-3">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}

export default async function CampaignGameRoomHeader({
  campaignId,
}: CampaignGameRoomHeaderProps) {
  const translations = await getTranslations("CampaignGameRoom");

  return (
    <CampaignGameRoomHeaderFrame
      account={<AccountArea />}
      backLabel={translations("backCompact")}
      campaignId={campaignId}
    />
  );
}

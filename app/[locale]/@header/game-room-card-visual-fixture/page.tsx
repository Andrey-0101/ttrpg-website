import { getTranslations } from "next-intl/server";

import { CampaignGameRoomHeaderFrame } from "@/components/campaigns/campaign-game-room-header";

type GameRoomCardVisualFixtureHeaderProps = {
  params: Promise<{ locale: string }>;
};

export default async function GameRoomCardVisualFixtureHeader({
  params,
}: GameRoomCardVisualFixtureHeaderProps) {
  const { locale } = await params;
  const translations = await getTranslations({
    locale,
    namespace: "CampaignGameRoom",
  });

  return (
    <CampaignGameRoomHeaderFrame
      account={<span className="block truncate">Fixture user</span>}
      backLabel={translations("backCompact")}
      campaignId="visual-fixture"
    />
  );
}

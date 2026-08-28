import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CampaignGameRoomVisualFixture from "@/components/campaigns/campaign-game-room-visual-fixture";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function GameRoomResponsiveVisualFixturePage({
  params,
}: PageProps<"/[locale]/game-room-responsive-visual-fixture.html">) {
  const { locale } = await params;
  const translations = await getTranslations({
    locale,
    namespace: "CampaignGameRoom",
  });

  return (
    <main
      className="campaign-game-room"
      data-campaign-game-room
      data-game-room-visual-fixture
    >
      <h1 className="sr-only">{translations("title")}</h1>
      <CampaignGameRoomVisualFixture />
    </main>
  );
}

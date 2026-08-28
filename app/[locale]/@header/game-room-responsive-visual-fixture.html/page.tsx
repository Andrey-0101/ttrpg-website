import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";

import { CampaignGameRoomHeaderFrame } from "@/components/campaigns/campaign-game-room-header";

export default async function GameRoomResponsiveVisualFixtureHeader({
  params,
}: PageProps<"/[locale]/game-room-responsive-visual-fixture.html">) {
  const { locale } = await params;
  const translations = await getTranslations({
    locale,
    namespace: "CampaignGameRoom",
  });
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CampaignGameRoomHeaderFrame
        account={
          <span className="block truncate text-sm text-white/80">
            {locale === "ru" ? "Макет" : "Fixture"}
          </span>
        }
        backLabel={translations("backCompact")}
        campaignId="visual-fixture"
      />
    </NextIntlClientProvider>
  );
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect as redirectToUrl } from "next/navigation";

import CampaignInvitationJoiner from "@/components/campaigns/campaign-invitation-joiner";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/server";

type CampaignJoinPageProps = {
  params: Promise<{
    locale: Locale;
    token: string;
  }>;
};

export async function generateMetadata({
  params,
}: CampaignJoinPageProps): Promise<Metadata> {
  const { locale } = await params;
  const translations = await getTranslations({
    locale,
    namespace: "PageMetadata",
  });

  return {
    title: translations("campaignJoin"),
  };
}

export default async function CampaignJoinPage({
  params,
}: CampaignJoinPageProps) {
  const { locale, token } = await params;
  const translations = await getTranslations({
    locale,
    namespace: "CampaignJoin",
  });
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    const nextPath = `/campaigns/join/${token}`;

    redirectToUrl(
      `/${locale}/login?next=${encodeURIComponent(nextPath)}`,
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-3 py-6 sm:px-6 lg:p-8">
      <Link href="/campaigns">
        <span aria-hidden="true">&larr;</span> {translations("back")}
      </Link>
      <CampaignInvitationJoiner token={token} />
    </main>
  );
}

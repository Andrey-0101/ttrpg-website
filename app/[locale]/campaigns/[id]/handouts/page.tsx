import { hasLocale } from "next-intl";

import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default async function CampaignHandoutsRedirect({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: requestedLocale, id } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  redirect({ href: `/campaigns/${id}/gallery`, locale });
}

import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import CampaignNotesJournal from "@/components/campaigns/campaign-notes-journal";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/server";

export default async function CampaignNotesPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: requestedLocale, id } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "CampaignNotes" });
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims?.claims?.sub) redirect({ href: "/login", locale });
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (error || !campaign) notFound();
  return (
    <main className="mx-auto w-full min-w-0 max-w-4xl p-4 sm:p-6">
      <Link
        href={`/campaigns/${campaign.id}`}
        className="inline-flex min-h-11 items-center rounded px-2 text-amber-200 focus-visible:outline focus-visible:outline-2"
      >
        ← {t("back")}
      </Link>
      <h1 className="mb-4 break-words text-2xl font-bold">{campaign.name}</h1>
      <div className="flex h-[70dvh] min-h-80 min-w-0 overflow-hidden rounded-xl border border-white/20 bg-black/60">
        <CampaignNotesJournal campaignId={campaign.id} />
      </div>
    </main>
  );
}

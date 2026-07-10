import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Link, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/server";

type DashboardPageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export async function generateMetadata({
  params,
}: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;

  const translations = await getTranslations({
    locale,
    namespace: "PageMetadata",
  });

  return {
    title: translations("dashboard"),
  };
}

export default async function DashboardPage({
  params,
}: DashboardPageProps) {
  const { locale } = await params;
  const translations = await getTranslations("Dashboard");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return redirect({
      href: "/login",
      locale,
    });
  }

  const email =
    typeof data.claims.email === "string"
      ? data.claims.email
      : translations("signedInUser");

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-3 py-6 sm:px-6 lg:p-8">
      <h1 className="text-3xl font-bold sm:text-4xl">
        {translations("title")}
      </h1>

      <p className="mt-4 break-words">
        {translations("loggedInAs")} <strong>{email}</strong>
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="flex flex-col rounded-lg border p-6">
          <h2 className="text-2xl font-bold">
            {translations("campaignsTitle")}
          </h2>
          <p className="mt-2 flex-1 text-white/80">
            {translations("campaignsDescription")}
          </p>
          <Link
            href="/campaigns"
            className="mt-6 rounded bg-white px-5 py-3 text-center font-medium text-black"
          >
            {translations("openCampaigns")}
          </Link>
        </section>

        <section className="flex flex-col rounded-lg border p-6">
          <h2 className="text-2xl font-bold">
            {translations("charactersTitle")}
          </h2>
          <p className="mt-2 flex-1 text-white/80">
            {translations("charactersDescription")}
          </p>
          <Link
            href="/characters"
            className="mt-6 rounded bg-white px-5 py-3 text-center font-medium text-black"
          >
            {translations("openCharacters")}
          </Link>
        </section>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
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

  const translations =
    await getTranslations("Dashboard");

  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.getClaims();

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
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <h1 className="text-4xl font-bold">
        {translations("title")}
      </h1>

      <p className="mt-4">
        {translations("loggedInAs")}{" "}
        <strong>{email}</strong>
      </p>

      <section className="mt-8 rounded-lg border p-6">
        <h2 className="text-2xl font-bold">
          {translations("campaignsTitle")}
        </h2>

        <p className="mt-2">
          {translations("noCampaigns")}
        </p>
      </section>

      <section className="mt-6 rounded-lg border p-6">
        <h2 className="text-2xl font-bold">
          {translations("charactersTitle")}
        </h2>

        <p className="mt-2">
          {translations("noCharacters")}
        </p>
      </section>
    </main>
  );
}
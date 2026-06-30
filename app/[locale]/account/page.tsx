import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type AccountPageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export async function generateMetadata({
  params,
}: AccountPageProps): Promise<Metadata> {
  const { locale } = await params;

  const translations = await getTranslations({
    locale,
    namespace: "PageMetadata",
  });

  return {
    title: translations("account"),
  };
}

export default async function AccountPage({
  params,
}: AccountPageProps) {
  const { locale } = await params;

  const translations =
    await getTranslations("AccountPage");

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
      : translations("unknownEmail");

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-8">
      <h1 className="text-4xl font-bold">
        {translations("title")}
      </h1>

      <section className="mt-8 rounded-lg border p-6">
        <p>
          <strong>
            {translations("email")}:
          </strong>{" "}

          <span className="font-mono font-semibold">
            {email}
          </span>
        </p>

        <p className="mt-4 text-gray-600">
          {translations("moreSettingsLater")}
        </p>
      </section>
    </main>
  );
}
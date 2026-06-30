import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type VampirePageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export async function generateMetadata({
  params,
}: VampirePageProps): Promise<Metadata> {
  const { locale } = await params;

  const translations = await getTranslations({
    locale,
    namespace: "PageMetadata",
  });

  return {
    title: translations("vampire"),
  };
}

export default async function VampirePage() {
  const translations =
    await getTranslations("VampireGamePage");

  return (
    <main className="mx-auto min-h-screen max-w-4xl p-8">
      <Link href="/games">
        ← {translations("back")}
      </Link>

      <h1 className="mt-8 text-4xl font-bold">
        Vampire: The Masquerade
      </h1>

      <p className="mt-4 text-lg">
        {translations("description")}
      </p>
    </main>
  );
}
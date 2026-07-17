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
  const diceTranslations =
    await getTranslations("VtmDiceRoller");

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

      <section className="mt-8 max-w-xl rounded-lg border border-white/25 p-6">
        <h2 className="text-2xl font-bold">
          {diceTranslations("entryTitle")}
        </h2>
        <p className="mt-2 text-white/80">
          {diceTranslations("entryDescription")}
        </p>
        <Link
          href="/games/vampire-the-masquerade/tools/dice"
          className="mt-5 inline-flex rounded bg-white px-5 py-3 font-medium text-black outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-red-950"
        >
          {diceTranslations("entryAction")}
        </Link>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import GoFirstDiceRoller from "@/components/dice-rollers/go-first-dice-roller";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { resolveDiceRollerReturnTo } from "@/lib/dice/dice-roller-navigation";

const SOURCE_LINKS = [
  {
    labelKey: "sourceOriginal",
    href: "https://web.archive.org/web/20231002203517/http://gofirstdice.ericharshbarger.org/doku.php?id=significant_solutions",
  },
  {
    labelKey: "sourcePaper",
    href: "https://doi.org/10.2478/rmm-2023-0004",
  },
  {
    labelKey: "sourceDiceLab",
    href: "https://mathartfun.com/thedicelab.com/GFD5.html",
  },
  {
    labelKey: "sourceScientificAmerican",
    href: "https://www.scientificamerican.com/article/unique-mathematical-60-sided-go-first-dice-go-on-display/",
  },
  {
    labelKey: "sourceLiveScience",
    href: "https://www.livescience.com/physics-mathematics/mathematics/mathematicians-say-these-60-sided-dice-are-the-fairest-in-the-world-designing-them-took-15-years",
  },
] as const;

type GoFirstDicePageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: GoFirstDicePageProps): Promise<Metadata> {
  const { locale } = await params;
  const translations = await getTranslations({
    locale,
    namespace: "GoFirstDice",
  });

  return {
    title: translations("metadataTitle"),
    description: translations("metadataDescription"),
  };
}

export default async function GoFirstDicePage({
  params,
  searchParams,
}: GoFirstDicePageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const translations = await getTranslations("GoFirstDice");
  const backHref = resolveDiceRollerReturnTo(locale, query.returnTo);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={backHref}
        className="inline-flex rounded-md text-sm font-semibold text-white/80 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-red-300"
      >
        ← {translations("back")}
      </Link>

      <header className="mt-6 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-200">
          {translations("eyebrow")}
        </p>
        <h1 className="mt-2 break-words text-3xl font-bold sm:text-4xl">
          {translations("title")}
        </h1>
        <p className="mt-4 break-words text-base text-white/80 sm:text-lg">
          {translations("description")}
        </p>
        <section
          aria-labelledby="go-first-acknowledgement-title"
          className="mt-4 rounded-lg border border-white/20 bg-white/5 p-4"
        >
          <h2
            id="go-first-acknowledgement-title"
            className="text-sm font-bold uppercase tracking-wide text-red-200"
          >
            {translations("acknowledgementTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            {translations("acknowledgementText")}
          </p>
        </section>
        <p className="mt-3 rounded-lg border border-white/15 bg-white/5 p-3 text-sm text-white/75">
          {translations("privacyNote")}
        </p>
      </header>

      <GoFirstDiceRoller />

      <section className="mt-10 max-w-3xl rounded-xl border border-white/20 bg-black/20 p-5 sm:p-6">
        <h2 className="text-2xl font-bold">{translations("howTitle")}</h2>
        <p className="mt-3 text-white/80">{translations("howText")}</p>
        <div className="mt-6 border-t border-white/15 pt-5">
          <h3 className="text-lg font-semibold">
            {translations("sourcesTitle")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {SOURCE_LINKS.map((source) => (
              <li key={source.href}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded underline decoration-white/50 underline-offset-4 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  {translations(source.labelKey)}
                  <span className="sr-only">
                    {translations("opensInNewTab")}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

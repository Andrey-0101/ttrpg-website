import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function CharacterNotFound() {
  const translations = await getTranslations("CharacterDetails");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-start px-3 py-6 sm:px-6 lg:p-8">
      <section className="w-full rounded-lg border border-white/30 bg-black/20 p-6 text-center sm:p-8">
        <h1 className="text-3xl font-bold">
          {translations("unavailableTitle")}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-white/80">
          {translations("unavailableDescription")}
        </p>
        <Link
          href="/characters"
          className="mt-6 inline-block rounded bg-white px-5 py-3 font-medium text-black"
        >
          {translations("back")}
        </Link>
      </section>
    </main>
  );
}

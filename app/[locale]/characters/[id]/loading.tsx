import { getTranslations } from "next-intl/server";

export default async function CharacterLoading() {
  const translations = await getTranslations("CharacterDetails");

  return (
    <main
      className="mx-auto min-h-screen w-full max-w-4xl px-3 py-6 sm:px-6 lg:p-8"
      aria-busy="true"
    >
      <p className="sr-only" role="status">
        {translations("loading")}
      </p>

      <div className="h-6 w-48 animate-pulse rounded bg-white/20" />

      <div
        className="mt-6 animate-pulse rounded-lg border border-white/20 bg-white p-4 sm:p-6"
        aria-hidden="true"
      >
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <div className="aspect-[3/4] rounded bg-black/10" />
          <div>
            <div className="h-9 w-2/3 rounded bg-black/15" />
            <div className="mt-5 h-5 w-full rounded bg-black/10" />
            <div className="mt-3 h-5 w-5/6 rounded bg-black/10" />
            <div className="mt-3 h-5 w-3/4 rounded bg-black/10" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-20 rounded bg-black/10" />
          ))}
        </div>
      </div>
    </main>
  );
}

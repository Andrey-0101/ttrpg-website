import { getTranslations } from "next-intl/server";

export default async function CharactersLoading() {
  const translations = await getTranslations("Characters");

  return (
    <main
      className="mx-auto min-h-screen w-full max-w-4xl px-3 py-6 sm:px-6 lg:p-8"
      aria-busy="true"
    >
      <p className="sr-only" role="status">
        {translations("loading")}
      </p>

      <div className="flex animate-pulse flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-10 w-56 rounded bg-white/20" />
        <div className="h-12 w-full rounded bg-white/20 sm:w-44" />
      </div>

      <div className="mt-8 grid gap-5" aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="min-h-44 animate-pulse rounded-lg border border-white/20 bg-white/10 p-5"
          >
            <div className="h-7 w-2/3 rounded bg-white/20" />
            <div className="mt-4 h-4 w-1/2 rounded bg-white/15" />
            <div className="mt-8 h-10 w-full rounded bg-white/15" />
          </div>
        ))}
      </div>
    </main>
  );
}

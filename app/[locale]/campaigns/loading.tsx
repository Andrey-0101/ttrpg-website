import { getTranslations } from "next-intl/server";

export default async function CampaignsLoading() {
  const translations = await getTranslations("Campaigns");

  return (
    <main
      className="mx-auto min-h-screen w-full max-w-5xl px-3 py-6 sm:px-6 lg:p-8"
      aria-busy="true"
    >
      <p className="sr-only" role="status">
        {translations("loading")}
      </p>

      <div className="flex animate-pulse flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-10 w-56 rounded bg-white/20" />
          <div className="mt-3 h-5 w-80 max-w-full rounded bg-white/15" />
        </div>
        <div className="h-12 w-full rounded bg-white/20 sm:w-44" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="min-h-64 animate-pulse rounded-lg border border-white/20 bg-white/10 p-5"
          >
            <div className="h-7 w-2/3 rounded bg-white/20" />
            <div className="mt-4 h-4 w-full rounded bg-white/15" />
            <div className="mt-2 h-4 w-4/5 rounded bg-white/15" />
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="h-16 rounded bg-white/15" />
              <div className="h-16 rounded bg-white/15" />
            </div>
            <div className="mt-6 h-10 w-28 rounded bg-white/15" />
          </div>
        ))}
      </div>
    </main>
  );
}

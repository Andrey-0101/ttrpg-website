import { getTranslations } from "next-intl/server";

export default async function CampaignLoading() {
  const translations = await getTranslations("CampaignDetails");

  return (
    <main
      className="mx-auto min-h-screen w-full max-w-5xl px-3 py-6 sm:px-6 lg:p-8"
      aria-busy="true"
    >
      <p className="sr-only" role="status">
        {translations("loading")}
      </p>

      <div className="h-6 w-44 animate-pulse rounded bg-white/20" />

      <div
        className="mt-6 animate-pulse overflow-hidden rounded-lg border border-white/20 bg-white p-5 sm:p-7"
        aria-hidden="true"
      >
        <div className="h-10 w-2/3 rounded bg-black/15" />
        <div className="mt-4 h-5 w-full rounded bg-black/10" />
        <div className="mt-2 h-5 w-4/5 rounded bg-black/10" />
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-20 rounded bg-black/10" />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-hidden="true">
        <div className="h-40 animate-pulse rounded-lg bg-white/10" />
        <div className="h-40 animate-pulse rounded-lg bg-white/10" />
      </div>

      <div className="mt-6 grid gap-6" aria-hidden="true">
        <div className="h-64 animate-pulse rounded-lg bg-white/10" />
        <div className="h-72 animate-pulse rounded-lg bg-white/10" />
        <div className="h-96 animate-pulse rounded-lg bg-white/10" />
      </div>
    </main>
  );
}

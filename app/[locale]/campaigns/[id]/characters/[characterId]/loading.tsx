import { getTranslations } from "next-intl/server";

export default async function CampaignCharacterLoading() {
  const translations = await getTranslations("CampaignCharacterDetails");

  return (
    <main
      className="mx-auto min-h-screen w-full max-w-4xl px-3 py-6 sm:px-6 lg:p-8"
      aria-busy="true"
    >
      <p className="sr-only" role="status">
        {translations("loading")}
      </p>

      <div className="h-6 w-52 animate-pulse rounded bg-white/20" />

      <div
        className="mt-6 min-h-[44rem] animate-pulse rounded-lg border border-white/20 bg-white/10 p-4"
        aria-hidden="true"
      >
        <div className="h-8 w-2/3 rounded bg-white/15" />
        <div className="mt-5 h-10 w-full rounded bg-white/10" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="h-72 rounded bg-white/10" />
          <div className="h-72 rounded bg-white/10" />
        </div>
      </div>
    </main>
  );
}

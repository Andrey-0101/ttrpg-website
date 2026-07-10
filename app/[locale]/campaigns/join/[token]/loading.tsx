import { getTranslations } from "next-intl/server";

export default async function CampaignJoinLoading() {
  const translations = await getTranslations("CampaignJoin");

  return (
    <main
      className="mx-auto min-h-screen w-full max-w-3xl px-3 py-6 sm:px-6 lg:p-8"
      aria-busy="true"
    >
      <p className="sr-only" role="status">
        {translations("loading")}
      </p>

      <div className="h-6 w-40 animate-pulse rounded bg-white/20" />

      <div
        className="mt-6 animate-pulse rounded-lg border border-white/20 bg-white p-5 sm:p-7"
        aria-hidden="true"
      >
        <div className="h-10 w-2/3 rounded bg-black/15" />
        <div className="mt-4 h-5 w-full rounded bg-black/10" />
        <div className="mt-2 h-5 w-4/5 rounded bg-black/10" />
        <div className="mt-7 h-12 w-44 rounded bg-black/15" />
      </div>
    </main>
  );
}

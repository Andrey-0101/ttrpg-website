import { getTranslations } from "next-intl/server";

export default async function NewCampaignLoading() {
  const translations = await getTranslations("CampaignCreate");

  return (
    <main
      className="mx-auto min-h-screen w-full max-w-3xl px-3 py-6 sm:px-6 lg:p-8"
      aria-busy="true"
    >
      <p className="sr-only" role="status">
        {translations("loading")}
      </p>

      <div className="h-6 w-44 animate-pulse rounded bg-white/20" />
      <div className="mt-6 h-10 w-64 animate-pulse rounded bg-white/20" />
      <div className="mt-3 h-5 w-full max-w-xl animate-pulse rounded bg-white/15" />

      <div
        className="mt-6 animate-pulse rounded-lg border border-white/20 bg-white p-5 sm:p-6"
        aria-hidden="true"
      >
        <div className="h-11 rounded bg-black/10" />
        <div className="mt-5 h-11 rounded bg-black/10" />
        <div className="mt-5 h-40 rounded bg-black/10" />
        <div className="mt-6 ml-auto h-12 w-full rounded bg-black/15 sm:w-44" />
      </div>
    </main>
  );
}

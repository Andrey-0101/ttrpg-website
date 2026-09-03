import { getTranslations } from "next-intl/server";

export default async function CampaignGalleryLoading() {
  const translations = await getTranslations("CampaignHandouts");

  return (
    <main
      className="mx-auto min-h-screen w-full max-w-6xl px-3 py-6 sm:px-6 lg:p-8"
      aria-busy="true"
    >
      <p className="sr-only" role="status">
        {translations("loading")}
      </p>
      <div className="h-6 w-44 animate-pulse rounded bg-white/20" />
      <div className="mt-7 h-10 w-72 animate-pulse rounded bg-white/20" />
      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-lg bg-white/10"
          />
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="aspect-[4/3] animate-pulse rounded-lg bg-white/10"
          />
        ))}
      </div>
    </main>
  );
}

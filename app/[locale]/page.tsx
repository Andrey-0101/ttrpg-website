import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Home() {
  const translations =
    await getTranslations("Home");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold">
        {translations("title")}
      </h1>

      <p className="mt-4 text-lg">
        {translations("description")}
      </p>

      <Link
        href="/games"
        className="mt-8 rounded-lg bg-black px-6 py-3 text-white"
      >
        {translations("browseGames")}
      </Link>
    </main>
  );
}
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function GamesPage() {
  const translations =
    await getTranslations("GamesPage");

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <h1 className="text-4xl font-bold">
        {translations("title")}
      </h1>

      <p className="mt-4">
        {translations("description")}
      </p>

      <div className="mt-8">
        <Link
          href="/games/vampire-the-masquerade"
          className="block max-w-md rounded-lg border p-6 hover:bg-gray-100 hover:text-black"
        >
          <h2 className="text-2xl font-bold">
            Vampire: The Masquerade
          </h2>

          <p className="mt-2">
            {translations("vampireDescription")}
          </p>
        </Link>
      </div>
    </main>
  );
}
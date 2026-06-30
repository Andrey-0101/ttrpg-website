import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GAME_SYSTEMS } from "@/lib/characters/game-systems";

export default async function SelectGameSystemPage() {
  const translations = await getTranslations(
    "CharacterSystemSelection"
  );

  const gameSystemsTranslations =
    await getTranslations("GameSystems");

  const gameSystems = Object.values(GAME_SYSTEMS);

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-8">
      <h1 className="text-4xl font-bold">
        {translations("title")}
      </h1>

      <p className="mt-4">
        {translations("description")}
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {gameSystems.map((system) => (
          <section
            key={system.id}
            className="flex flex-col rounded-lg border p-6"
          >
            <h2 className="text-2xl font-bold">
              {system.name}
            </h2>

            <p className="mt-3 flex-1">
              {system.id === "vtm-v5"
                ? gameSystemsTranslations(
                    "vtmV5.description"
                  )
                : gameSystemsTranslations(
                    "callOfCthulhu7e.description"
                  )}
            </p>

            {system.available ? (
              <Link
                href={`/characters/new/${system.id}`}
                className="mt-6 rounded bg-black px-5 py-3 text-center text-white"
              >
                {translations("create")}
              </Link>
            ) : (
              <span className="mt-6 rounded bg-gray-200 px-5 py-3 text-center text-gray-600">
                {translations("comingSoon")}
              </span>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
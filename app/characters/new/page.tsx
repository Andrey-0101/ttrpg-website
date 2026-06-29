import Link from "next/link";
import { GAME_SYSTEMS } from "@/lib/characters/game-systems";

export default function SelectGameSystemPage() {
  const gameSystems = Object.values(GAME_SYSTEMS);

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-8">
      <h1 className="text-4xl font-bold">Choose a Game System</h1>

      <p className="mt-4">
        Select the game system for your new character.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {gameSystems.map((system) => (
          <section
            key={system.id}
            className="flex flex-col rounded-lg border p-6"
          >
            <h2 className="text-2xl font-bold">{system.name}</h2>

            <p className="mt-3 flex-1">{system.description}</p>

            {system.available ? (
              <Link
                href={`/characters/new/${system.id}`}
                className="mt-6 rounded bg-black px-5 py-3 text-center text-white"
              >
                Create Character
              </Link>
            ) : (
              <span className="mt-6 rounded bg-gray-200 px-5 py-3 text-center text-gray-600">
                Coming Soon
              </span>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
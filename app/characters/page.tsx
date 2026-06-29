import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getGameSystemName } from "@/lib/characters/game-systems";
import DeleteCharacterButton from "@/components/characters/delete-character-button";

export default async function CharactersPage() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect("/login");
  }

  const { data: characters, error } = await supabase
    .from("characters")
    .select("id, name, game_system, description, visibility")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold">My Characters</h1>

        <Link
          href="/characters/new"
          className="rounded bg-black px-5 py-3 text-white"
        >
          Create Character
        </Link>
      </div>

      {error && (
        <p className="mt-8">
          Unable to load characters: {error.message}
        </p>
      )}

      {!error && characters?.length === 0 && (
        <p className="mt-8">
          You do not have any characters yet.
        </p>
      )}

      <div className="mt-8 grid gap-4">
        {characters?.map((character) => (
          <section
            key={character.id}
            className="flex min-h-56 flex-col rounded-lg border p-6"
          >
            <h2 className="text-2xl font-bold">
              {character.name}
            </h2>

            <p className="mt-2">
              {getGameSystemName(character.game_system)}
            </p>

            <p className="mt-2 whitespace-pre-line">
              {character.description || "No short description"}
            </p>

            <p className="mt-2 text-sm">
              Visibility: {character.visibility}
            </p>

            <div className="mt-auto flex items-end justify-between gap-4 pt-6">
              <Link
                href={`/characters/${character.id}`}
                className="rounded border px-4 py-2 hover:bg-gray-100 hover:text-black"
              >
                Open
              </Link>

              <DeleteCharacterButton
                characterId={character.id}
                characterName={character.name}
              />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
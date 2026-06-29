import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">My Characters</h1>

        <Link
          href="/characters/new"
          className="rounded bg-black px-5 py-3 text-white"
        >
          Create Character
        </Link>
      </div>

      {error && (
        <p className="mt-8">Unable to load characters: {error.message}</p>
      )}

      {!error && characters?.length === 0 && (
        <p className="mt-8">You do not have any characters yet.</p>
      )}

      <div className="mt-8 grid gap-4">
        {characters?.map((character) => (
          <section key={character.id} className="rounded-lg border p-6">
            <h2 className="text-2xl font-bold">
                <Link
                    href={`/characters/${character.id}`}
                    className="hover:underline"
                >
                    {character.name}
                </Link>
            </h2>

            <p className="mt-2">{character.game_system}</p>

            <p className="mt-2">
              {character.description || "No description"}
            </p>

            <p className="mt-2 text-sm">
              Visibility: {character.visibility}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
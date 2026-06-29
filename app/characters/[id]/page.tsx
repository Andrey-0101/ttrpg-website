import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CharacterEditor from "@/components/characters/character-editor";

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect("/login");
  }

  const { data: character, error } = await supabase
    .from("characters")
    .select("id, name, game_system, description, visibility, sheet_data")
    .eq("id", id)
    .single();

  if (error || !character) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-8">
      <Link href="/characters">← Back to My Characters</Link>

      <CharacterEditor character={character} />
    </main>
  );
}
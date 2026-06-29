import Link from "next/link";
import { notFound } from "next/navigation";
import CharacterCreator from "@/components/characters/character-creator";
import {
  getGameSystem,
  type GameSystemId,
} from "@/lib/characters/game-systems";

export default async function NewCharacterPage({
  params,
}: {
  params: Promise<{ system: string }>;
}) {
  const { system: systemId } = await params;
  const gameSystem = getGameSystem(systemId);

  if (!gameSystem || !gameSystem.available) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-8">
      <Link href="/characters/new">← Back to Game Systems</Link>

      <h1 className="mt-8 text-4xl font-bold">
        Create a {gameSystem.name} Character
      </h1>

      <CharacterCreator systemId={systemId as GameSystemId} />
    </main>
  );
}
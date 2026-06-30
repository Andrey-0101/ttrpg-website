import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import CharacterCreator from "@/components/characters/character-creator";
import {
  getGameSystem,
  type GameSystemId,
} from "@/lib/characters/game-systems";

export default async function NewCharacterPage({
  params,
}: {
  params: Promise<{
    system: string;
  }>;
}) {
  const translations =
    await getTranslations("CharacterNew");

  const { system: systemId } = await params;
  const gameSystem = getGameSystem(systemId);

  if (!gameSystem || !gameSystem.available) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-8">
      <Link href="/characters/new">
        ← {translations("back")}
      </Link>

      <h1 className="mt-8 text-4xl font-bold">
        {translations("title", {
          system: gameSystem.name,
        })}
      </h1>

      <CharacterCreator
        systemId={systemId as GameSystemId}
      />
    </main>
  );
}
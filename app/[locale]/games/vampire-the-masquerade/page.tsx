import { Link } from "@/i18n/navigation";

export default function VampirePage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl p-8">
      <Link href="/games">← Back to Games</Link>

      <h1 className="mt-8 text-4xl font-bold">
        Vampire: The Masquerade
      </h1>

      <p className="mt-4 text-lg">
        A tabletop role-playing game about vampires, personal horror,
        political intrigue, and the struggle to retain humanity.
      </p>
    </main>
  );
}
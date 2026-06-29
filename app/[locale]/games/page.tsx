import { Link } from "@/i18n/navigation";

export default function GamesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <h1 className="text-4xl font-bold">Games</h1>

      <p className="mt-4">
        Choose a tabletop role-playing game.
      </p>

      <div className="mt-8">
        <Link
          href="/games/vampire-the-masquerade"
          className="block max-w-md rounded-lg border p-6 hover:bg-gray-100"
        >
          <h2 className="text-2xl font-bold">
            Vampire: The Masquerade
          </h2>

          <p className="mt-2">
            Personal horror, political intrigue, and the struggle to retain
            humanity.
          </p>
        </Link>
      </div>
    </main>
  );
}
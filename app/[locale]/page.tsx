import { Link } from "@/i18n/navigation";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold">Welcome to TTRPG Hub</h1>

      <p className="mt-4 text-lg">
        Your campaigns, characters, and gaming tools in one place.
      </p>

      <Link
        href="/games"
        className="mt-8 rounded-lg bg-black px-6 py-3 text-white"
      >
        Browse Games
      </Link>
    </main>
  );
}
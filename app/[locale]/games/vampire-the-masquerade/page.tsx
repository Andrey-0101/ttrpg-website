import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function VampirePage() {
  const translations =
    await getTranslations("VampireGamePage");

  return (
    <main className="mx-auto min-h-screen max-w-4xl p-8">
      <Link href="/games">
        ← {translations("back")}
      </Link>

      <h1 className="mt-8 text-4xl font-bold">
        Vampire: The Masquerade
      </h1>

      <p className="mt-4 text-lg">
        {translations("description")}
      </p>
    </main>
  );
}
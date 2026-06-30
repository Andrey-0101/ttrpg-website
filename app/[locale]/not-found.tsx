import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFoundPage() {
  const translations =
    useTranslations("NotFoundPage");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center p-8 text-center">
      <p className="text-lg font-semibold">
        404
      </p>

      <h1 className="mt-3 text-4xl font-bold">
        {translations("title")}
      </h1>

      <p className="mt-4 text-lg">
        {translations("description")}
      </p>

      <Link
        href="/"
        className="mt-8 rounded bg-black px-6 py-3 text-white"
      >
        {translations("home")}
      </Link>
    </main>
  );
}
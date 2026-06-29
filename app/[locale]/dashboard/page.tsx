import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const translations = await getTranslations("Dashboard");
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const email =
    typeof data.claims.email === "string"
      ? data.claims.email
      : translations("signedInUser");

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <h1 className="text-4xl font-bold">
        {translations("title")}
      </h1>

      <p className="mt-4">
        {translations("loggedInAs")}{" "}
        <strong>{email}</strong>
      </p>

      <section className="mt-8 rounded-lg border p-6">
        <h2 className="text-2xl font-bold">
          {translations("campaignsTitle")}
        </h2>

        <p className="mt-2">
          {translations("noCampaigns")}
        </p>
      </section>

      <section className="mt-6 rounded-lg border p-6">
        <h2 className="text-2xl font-bold">
          {translations("charactersTitle")}
        </h2>

        <p className="mt-2">
          {translations("noCharacters")}
        </p>
      </section>

      <form
        action="/auth/signout"
        method="post"
        className="mt-8"
      >
        <button
          type="submit"
          className="rounded bg-black px-6 py-3 text-white"
        >
          {translations("logout")}
        </button>
      </form>
    </main>
  );
}
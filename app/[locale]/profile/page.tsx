import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { Link, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

type ProfilePageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export default async function ProfilePage({
  params,
}: ProfilePageProps) {
  const { locale } = await params;
  const translations = await getTranslations("Profile");
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    return redirect({
      href: "/login",
      locale,
    });
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("username, display_name, bio")
      .eq("id", userId)
      .single();

  if (profileError) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl p-8">
        <h1 className="text-4xl font-bold">
          {translations("title")}
        </h1>

        <p className="mt-4">
          {translations("loadError")}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-8">
      <h1 className="text-4xl font-bold">
        {translations("title")}
      </h1>

      <section className="mt-8 rounded-lg border p-6">
        <p>
          <strong>{translations("username")}:</strong>{" "}
          {profile.username || translations("notSpecified")}
        </p>

        <p className="mt-4">
          <strong>{translations("displayName")}:</strong>{" "}
          {profile.display_name ||
            translations("notSpecified")}
        </p>

        <p className="mt-4">
          <strong>{translations("bio")}:</strong>{" "}
          {profile.bio || translations("notSpecified")}
        </p>
      </section>

      <Link
        href="/profile/edit"
        className="mt-6 inline-block rounded bg-black px-6 py-3 text-white"
      >
        {translations("edit")}
      </Link>
    </main>
  );
}
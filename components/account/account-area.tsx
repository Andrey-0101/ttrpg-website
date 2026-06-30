import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { Link } from "@/i18n/navigation";
import SignOutButton from "./sign-out-button";

export default async function AccountArea() {
  const translations =
    await getTranslations("AccountArea");

  const supabase = await createClient();

  const { data } =
    await supabase.auth.getClaims();

  const claims = data?.claims;

  if (!claims) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/login">
          {translations("login")}
        </Link>

        <Link href="/register">
          {translations("register")}
        </Link>
      </div>
    );
  }

  const userId =
    typeof claims.sub === "string"
      ? claims.sub
      : null;

  const email =
    typeof claims.email === "string"
      ? claims.email
      : "";

  let accountName = email || translations("account");

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", userId)
      .maybeSingle();

    accountName =
      profile?.display_name ||
      profile?.username ||
      email ||
      translations("account");
  }

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded border px-4 py-2">
        {accountName} ▾
      </summary>

      <div className="absolute right-0 z-20 mt-2 min-w-56 rounded-lg border bg-white p-3 text-black shadow-lg">
        <nav className="flex flex-col gap-1">
          <Link
            href="/profile"
            className="rounded px-3 py-2 hover:bg-gray-100"
          >
            {translations("myProfile")}
          </Link>

          <Link
            href="/account"
            className="rounded px-3 py-2 hover:bg-gray-100"
          >
            {translations("accountSettings")}
          </Link>
        </nav>

        <div className="mt-2 border-t pt-3">
          <SignOutButton className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50" />
        </div>
      </div>
    </details>
  );
}
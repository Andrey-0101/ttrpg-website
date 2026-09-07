import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import CustomDicePool from "@/components/dice-rollers/custom-dice-pool";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { resolveDiceRollerReturnTo } from "@/lib/dice/dice-roller-navigation";
import {
  listPersonalRollHistory,
  listSavedCustomDicePresets,
} from "@/lib/dice/personal-dice-persistence.server";
import type { PersonalRollHistoryEntry } from "@/lib/dice/personal-dice-persistence-service";
import type { SavedPresetAccess } from "@/lib/dice/saved-custom-dice-presets-ui";
import { createClient } from "@/utils/supabase/server";

type CustomDicePoolPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: CustomDicePoolPageProps): Promise<Metadata> {
  const { locale } = await params;
  const translations = await getTranslations({
    locale,
    namespace: "CustomDicePool",
  });

  return {
    title: translations("metadataTitle"),
    description: translations("metadataDescription"),
  };
}

export default async function CustomDicePoolPage({
  params,
  searchParams,
}: CustomDicePoolPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const translations = await getTranslations("CustomDicePool");
  const backHref = resolveDiceRollerReturnTo(locale, query.returnTo);
  let presetAccess: SavedPresetAccess = { authenticated: false };
  let historyEntries: PersonalRollHistoryEntry[] | null = null;
  try {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    if (!claimsError && claimsData?.claims) {
      const [presetResult, historyResult] = await Promise.all([
        listSavedCustomDicePresets(),
        listPersonalRollHistory(["custom_dice_pool"]),
      ]);
      presetAccess = presetResult.ok
        ? {
            authenticated: true,
            presets: presetResult.data,
            loadError: null,
          }
        : {
            authenticated: true,
            presets: [],
            loadError:
              presetResult.error.code === "authentication_required" ||
              presetResult.error.code === "persistence_unavailable"
                ? presetResult.error.code
                : "unexpected_error",
          };
      if (historyResult.ok) {
        historyEntries = historyResult.data;
      }
    } else if (claimsError) {
      presetAccess = {
        authenticated: null,
        loadError: "persistence_unavailable",
      };
    }
  } catch {
    presetAccess = {
      authenticated: null,
      loadError: "persistence_unavailable",
    };
  }
  const privacyNoteKey =
    presetAccess.authenticated === true
      ? "privacyNoteAuthenticated"
      : presetAccess.authenticated === false
        ? "privacyNoteGuest"
        : "privacyNoteUnavailable";

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={backHref}
        className="inline-flex rounded-md text-sm font-semibold text-white/80 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-red-300"
      >
        ← {translations("back")}
      </Link>

      <header className="mt-6 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-200">
          {translations("eyebrow")}
        </p>
        <h1 className="mt-2 break-words text-3xl font-bold sm:text-4xl">
          {translations("title")}
        </h1>
        <p className="mt-4 break-words text-base text-white/80 sm:text-lg">
          {translations("description")}
        </p>
        <p className="mt-3 rounded-lg border border-white/15 bg-white/5 p-3 text-sm text-white/75">
          {translations(privacyNoteKey)}
        </p>
      </header>

      <CustomDicePool
        presetAccess={presetAccess}
        initialHistoryEntries={historyEntries}
      />
    </main>
  );
}

import {
  type NextRequest,
  NextResponse,
} from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest
) {
  const requestUrl = new URL(request.url);

  const code =
    requestUrl.searchParams.get("code");

  const requestedLocale =
    requestUrl.searchParams.get("locale");

  const locale = hasLocale(
    routing.locales,
    requestedLocale
  )
    ? requestedLocale
    : routing.defaultLocale;

  if (code) {
    const supabase = await createClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(
        code
      );

    if (!error) {
      return NextResponse.redirect(
        new URL(`/${locale}`, request.url)
      );
    }
  }

  return NextResponse.redirect(
    new URL(
      `/${locale}/register?error=confirmation_failed`,
      request.url
    )
  );
}
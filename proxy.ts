import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./utils/supabase/proxy";

const handleI18nRouting = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const supabaseResponse = await updateSession(request);
  const intlResponse = handleI18nRouting(request);

  for (const cookie of supabaseResponse.cookies.getAll()) {
    intlResponse.cookies.set(
      cookie.name,
      cookie.value,
      cookie
    );
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
};
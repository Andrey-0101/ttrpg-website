type SiteUrlValue = string | null | undefined;

export function normalizeSiteOrigin(value: SiteUrlValue): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function resolveSiteOrigin(
  configuredSiteUrl: SiteUrlValue,
  currentOrigin?: SiteUrlValue,
): string | null {
  return (
    normalizeSiteOrigin(configuredSiteUrl) ??
    normalizeSiteOrigin(currentOrigin)
  );
}

export function getSiteOrigin(currentOrigin?: SiteUrlValue): string | null {
  return resolveSiteOrigin(
    process.env.NEXT_PUBLIC_SITE_URL,
    currentOrigin,
  );
}

function isSafeRootRelativePath(path: string): boolean {
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\")
  );
}

export function createSiteUrl(
  path: string,
  currentOrigin?: SiteUrlValue,
  configuredSiteUrl: SiteUrlValue = process.env.NEXT_PUBLIC_SITE_URL,
): URL | null {
  const origin = resolveSiteOrigin(configuredSiteUrl, currentOrigin);

  if (!origin) {
    return null;
  }

  if (!isSafeRootRelativePath(path)) {
    return null;
  }

  try {
    const url = new URL(path, `${origin}/`);

    return url.origin === origin && !url.username && !url.password
      ? url
      : null;
  } catch {
    return null;
  }
}

export function createRegistrationCallbackUrl(
  locale: "en" | "ru",
  currentOrigin?: string | null,
  configuredSiteUrl?: string | null,
): URL | null {
  const callbackUrl = createSiteUrl(
    "/auth/confirm",
    currentOrigin,
    configuredSiteUrl,
  );

  if (!callbackUrl) {
    return null;
  }

  callbackUrl.searchParams.set("locale", locale);

  return callbackUrl;
}

export function createCampaignInvitationPath(
  locale: string,
  invitationToken: string,
): string {
  return `/${locale}/campaigns/join/${encodeURIComponent(invitationToken)}`;
}

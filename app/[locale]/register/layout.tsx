import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

type RegisterLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: RegisterLayoutProps): Promise<Metadata> {
  const { locale } = await params;

  const validLocale = hasLocale(
    routing.locales,
    locale
  )
    ? locale
    : routing.defaultLocale;

  const translations = await getTranslations({
    locale: validLocale,
    namespace: "PageMetadata",
  });

  return {
    title: translations("register"),
  };
}

export default function RegisterLayout({
  children,
}: RegisterLayoutProps) {
  return children;
}
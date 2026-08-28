import type { Metadata } from "next";
import {
  NextIntlClientProvider,
  hasLocale,
} from "next-intl";
import {
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

type LocaleLayoutProps = {
  children: React.ReactNode;
  header: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const translations = await getTranslations({
    locale,
    namespace: "Metadata",
  });

  return {
    title: {
      default: translations("title"),
      template: `%s | ${translations("title")}`,
    },
    description: translations("description"),
  };
}

export default async function LocaleLayout({
  children,
  header,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      <div className="min-h-screen">
        {header}
        {children}
      </div>
    </NextIntlClientProvider>
  );
}

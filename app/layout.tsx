import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getSiteOrigin } from "@/lib/site-url";
import "./globals.css";

const siteOrigin = getSiteOrigin();

export const metadata: Metadata = {
  metadataBase: siteOrigin ? new URL(siteOrigin) : undefined,
  title: "TTRPG Hub",
  description:
    "Campaigns, characters, and tools for TTRPG gaming.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}

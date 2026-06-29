import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TTRPG Hub",
  description: "Campaigns, characters, and tools for TTRPG gaming.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
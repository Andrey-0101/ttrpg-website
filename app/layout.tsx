import type { Metadata } from "next";
import Link from "next/link";
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
        <header className="border-b px-8 py-4">
          <nav className="mx-auto flex max-w-6xl items-center gap-6">
            <Link href="/" className="text-xl font-bold">
              TTRPG Hub
            </Link>

            <Link href="/games">Games</Link>
            <Link href="/login">Log in</Link>
            <Link href="/register">Register</Link>
            <Link href="/dashboard">Dashboard</Link>
          </nav>
        </header>

        {children}
      </body>
    </html>
  );
}
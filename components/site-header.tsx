import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/language-switcher";
import AccountArea from "@/components/account/account-area";

export default async function SiteHeader() {
  const navigation =
    await getTranslations("Navigation");

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-6 px-8 py-5">
        <Link
          href="/"
          className="text-xl font-bold"
        >
          TTRPG Hub
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-5">
          <Link href="/games">
            {navigation("games")}
          </Link>

          <Link href="/dashboard">
            {navigation("dashboard")}
          </Link>

          <Link href="/characters">
            {navigation("characters")}
          </Link>
        </nav>

        <AccountArea />

        <LanguageSwitcher />
      </div>
    </header>
  );
}
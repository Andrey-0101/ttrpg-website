import Image from "next/image";
import { getTranslations } from "next-intl/server";

const PARADOX_NOTICE =
  "Portions of the materials are the copyrights and trademarks of Paradox Interactive AB, and are used with permission. All rights reserved. For more information please visit worldofdarkness.com.";

export default async function DarkPackNotice() {
  const translations = await getTranslations("VtmDiceRoller.darkPack");

  return (
    <aside
      className="mt-8 flex min-w-0 flex-col gap-4 rounded-lg border border-white/15 bg-black/20 p-4 text-sm text-white/70 sm:flex-row sm:items-center"
      aria-labelledby="dark-pack-notice-title"
    >
      <Image
        src="/assets/world-of-darkness/dark-pack/dark-pack-logo-color.png"
        alt={translations("logoAlt")}
        width={3000}
        height={3008}
        className="h-20 w-20 shrink-0 object-contain"
      />
      <div className="min-w-0">
        <h2
          id="dark-pack-notice-title"
          className="font-semibold text-white/90"
        >
          {translations("title")}
        </h2>
        <p className="mt-1 break-words">{translations("unofficial")}</p>
        <p className="mt-2 break-words text-xs leading-relaxed">
          {PARADOX_NOTICE}
        </p>
      </div>
    </aside>
  );
}

"use client";

import { useTranslations } from "next-intl";

const CHAOSIUM_FAN_MATERIAL_NOTICE =
  "This website uses trademarks and/or copyrights owned by Chaosium Inc/Moon Design Publications LLC, which are used under Chaosium Inc’s Fan Material Policy. We are expressly prohibited from charging you to use or access this content. This website is not published, endorsed, or specifically approved by Chaosium Inc. For more information about Chaosium Inc’s products, please visit ";

export default function Coc7eFanMaterialNotice() {
  const translations = useTranslations("Coc7eCharacterSheet");

  return (
    <aside
      aria-label={translations("fanMaterial.title")}
      className="rounded-lg border border-white/30 bg-black/45 p-3 text-xs leading-relaxed text-white/85"
    >
      <h2 className="font-semibold text-white">
        {translations("fanMaterial.title")}
      </h2>
      <p className="mt-1">
        {CHAOSIUM_FAN_MATERIAL_NOTICE}
        <a
          href="https://www.chaosium.com/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          www.chaosium.com
        </a>
        .
      </p>
    </aside>
  );
}

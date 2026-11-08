import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createTranslator } from "next-intl";
import { resolveCampaignGameMasterRole } from "../../lib/game-systems/campaign-role";
import { resolveCampaignVideoParticipantLabel } from "../../lib/campaign-video/participant-label";

function messages(locale: string) {
  return JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
}

for (const locale of ["en", "ru"]) {
  const dictionary = messages(locale);
  const translateRole = createTranslator({ locale, messages: dictionary.CampaignRoles });
  const translate = createTranslator({ locale, messages: dictionary });
  const roleFor = (system: string | null | undefined) => resolveCampaignGameMasterRole(system, translateRole);
  const expected = locale === "ru"
    ? { "call-of-cthulhu-7e": "Хранитель", "vtm-v5": "Рассказчик" }
    : { "call-of-cthulhu-7e": "Keeper", "vtm-v5": "Storyteller" };

  test(`campaign role mapping uses the exact short system titles (${locale})`, () => {
    for (const [system, name] of Object.entries(expected)) assert.equal(roleFor(system).role, name);
    assert.equal(roleFor("Call of Cthulhu 7th Edition").role, expected["call-of-cthulhu-7e"]);
    assert.equal(roleFor("Vampire: The Masquerade V5").role, expected["vtm-v5"]);
  });

  test(`unknown and registered-but-unmapped systems use the generic role (${locale})`, () => {
    for (const system of [null, undefined, "", "unknown-system", "delta-green", "constructor"]) {
      assert.equal(roleFor(system).role, locale === "ru" ? "Мастер игры" : "Game Master");
    }
  });

  test(`GM names and missing-profile fallbacks compose with each system; player labels stay unchanged (${locale})`, () => {
    for (const [system, name] of Object.entries(expected)) {
      for (const profileName of [null, "", " \t\n", "Andrey"]) {
        const profile = profileName?.trim() || (locale === "ru" ? "Инкогнито" : "Incognito");
        const labels = { ...dictionary.CampaignVideoRoom.labels, gameMasterRole: roleFor(system).role };
        assert.equal(resolveCampaignVideoParticipantLabel({ role: "game_master", profileName, characterName: "Ignored", labels }), `${profile} aka ${name}`);
        assert.equal(resolveCampaignVideoParticipantLabel({ role: "player", profileName, characterName: "Иван John", labels }), `${profile} aka Иван John`);
        assert.equal(resolveCampaignVideoParticipantLabel({ role: "player", profileName, characterName: "  ", labels }),
          `${profile} aka ${locale === "ru" ? "Странный незнакомец" : "Strange stranger"}`);
      }
    }
  });

  test(`campaign prose formats grammatical role forms and ICU plurals (${locale})`, () => {
    const keys = ["CampaignMembers.description", "CampaignManagement.description", "CampaignGameRoom.overview.description",
      "CampaignCharacters.description", "CampaignCharacters.gameMasterForbidden", "CampaignHandouts.playerDescription",
      "CampaignHandouts.completedGameMasterDescription", "CampaignHandouts.emptyPlayerDescription", "CampaignHandouts.imageUnavailable",
      "CampaignHandouts.uploadDescription", "CampaignHandouts.uploadBatchSuccess", "CampaignHandouts.visibility.gmOnly"];
    for (const system of ["call-of-cthulhu-7e", "vtm-v5", "unknown-system"]) {
      const role = roleFor(system);
      for (const key of keys) {
        const result = translate(key, { ...role, count: 2, category: "Карты / Maps" });
        assert.doesNotMatch(result, /\{(?:role|roleGenitive|roleDative)\}/u);
        assert.ok(result.includes(role.role) || result.includes(role.roleGenitive) || result.includes(role.roleDative), key);
      }
      if (locale === "ru") {
        assert.ok(translate("CampaignManagement.description", role).includes(`постоянному ${role.roleDative}`));
        assert.ok(translate("CampaignGameRoom.overview.description", role).includes(`галереи ${role.roleGenitive}`));
        assert.ok(translate("CampaignCharacters.description", role).includes(`лист ${role.roleDative}`));
      }
    }
  });
}

test("locale switching changes only role/fallback text and never changes actual names or the internal role", () => {
  const entry = { role: "game_master" as const, profileName: "Андрей John", characterName: null };
  const labels = ["en", "ru", "en"].map((locale) => {
    const dictionary = messages(locale);
    const role = resolveCampaignGameMasterRole("call-of-cthulhu-7e", createTranslator({ locale, messages: dictionary.CampaignRoles }));
    return resolveCampaignVideoParticipantLabel({ ...entry, labels: { ...dictionary.CampaignVideoRoom.labels, gameMasterRole: role.role } });
  });
  assert.deepEqual(labels, ["Андрей John aka Keeper", "Андрей John aka Хранитель", "Андрей John aka Keeper"]);
  assert.deepEqual(entry, { role: "game_master", profileName: "Андрей John", characterName: null });
  assert.equal(messages("en").Campaigns.description, "Campaigns you lead as Game Master or have joined as a Player.");
  assert.equal(messages("en").CampaignCreate.intro, "Set up the campaign basics. You will become its permanent Game Master.");
});

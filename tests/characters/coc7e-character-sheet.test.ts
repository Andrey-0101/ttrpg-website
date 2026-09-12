import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  COC7E_FIXED_SKILLS,
  COC7E_FIXED_SKILL_IDS,
} from "../../lib/characters/call-of-cthulhu-7e/definitions";
import {
  getCoc7eCharacterDraftKey,
  getCoc7eCharacterPageKey,
  getNewCoc7eCharacterDraftKey,
  getNewCoc7eCharacterPageKey,
  readCoc7eEditorDraft,
  readCoc7eSheetPage,
  removeCoc7eEditorDraft,
  writeCoc7eEditorDraft,
  writeCoc7eSheetPage,
} from "../../lib/characters/call-of-cthulhu-7e/editor-draft";
import {
  COC7E_SCHEMA_VERSION,
  createDefaultCoc7eSheetData,
  getCoc7eBuildAndDamageBonus,
  getCoc7eFixedSkillBase,
  getCoc7eFixedSkillValue,
  getCoc7eInsaneThreshold,
  getCoc7eMaximumHitPoints,
  getCoc7eMaximumMagicPoints,
  getCoc7eMaximumSanity,
  getCoc7eMove,
  getCoc7eSpecialtyValue,
  getCoc7eThresholds,
  normalizeCoc7eNumber,
  normalizeCoc7eSheetData,
  updateCoc7eCharacteristic,
  validateCoc7eSheetData,
  type Coc7eSheetData,
} from "../../lib/characters/call-of-cthulhu-7e/schema";
import {
  createCharacterPortraitPath,
  validateCharacterPortraitFile,
} from "../../lib/characters/portrait";

test("CoC 7e defaults use schema version 1 and the approved row counts", () => {
  const sheet = createDefaultCoc7eSheetData();

  assert.equal(sheet.schemaVersion, COC7E_SCHEMA_VERSION);
  assert.equal(Object.keys(sheet.skills.fixed).length, 39);
  assert.equal(sheet.skills.specialties.artCraft.length, 2);
  assert.equal(sheet.skills.specialties.fighting.length, 2);
  assert.equal(sheet.skills.specialties.firearms.length, 1);
  assert.equal(sheet.skills.specialties.languageOther.length, 3);
  assert.equal(sheet.skills.specialties.languageOwn.length, 1);
  assert.equal(sheet.skills.specialties.pilot.length, 1);
  assert.equal(sheet.skills.specialties.science.length, 3);
  assert.equal(sheet.skills.specialties.survival.length, 1);
  assert.equal(sheet.skills.specialties.custom.length, 4);
  assert.equal(sheet.weapons.length, 3);
  assert.equal(
    new Set([
      ...Object.values(sheet.skills.specialties).flatMap((rows) => rows.map((row) => row.id)),
      ...sheet.weapons.map((row) => row.id),
    ]).size,
    21,
  );
});

test("malformed payloads normalize safely and preserve extensions", () => {
  assert.deepEqual(normalizeCoc7eSheetData(null), createDefaultCoc7eSheetData());
  assert.deepEqual(normalizeCoc7eSheetData([]), createDefaultCoc7eSheetData());

  const normalized = normalizeCoc7eSheetData({
    schemaVersion: 999,
    futureField: { enabled: true },
    extensions: { existing: "kept" },
    identity: { occupation: "Antiquarian", age: "42" },
    story: 42,
  });

  assert.equal(normalized.schemaVersion, 1);
  assert.equal(normalized.identity.occupation, "Antiquarian");
  assert.equal(normalized.identity.age, null);
  assert.equal(normalized.story, "");
  assert.deepEqual(normalized.extensions, {
    existing: "kept",
    futureField: { enabled: true },
  });
});

test("numeric normalization accepts only finite integers in the technical range", () => {
  assert.equal(normalizeCoc7eNumber(0), 0);
  assert.equal(normalizeCoc7eNumber(999), 999);
  for (const invalid of [-1, 1000, 1.5, Number.NaN, Number.POSITIVE_INFINITY, "12", null]) {
    assert.equal(normalizeCoc7eNumber(invalid), null);
  }
});

test("normalization restores stable unique specialty and weapon row IDs", () => {
  const normalized = normalizeCoc7eSheetData({
    skills: {
      specialties: {
        artCraft: [
          { id: "duplicate", specialty: "Painting", value: 40 },
          { id: "duplicate", specialty: "Sculpture", value: 30 },
        ],
      },
    },
    weapons: [{ id: "same" }, { id: "same" }],
  });

  assert.equal(normalized.skills.specialties.artCraft[0].id, "duplicate");
  assert.equal(normalized.skills.specialties.artCraft[1].id, "duplicate-2");
  assert.equal(normalized.weapons[0].id, "same");
  assert.equal(normalized.weapons[1].id, "same-2");
  assert.equal(normalized.weapons[2].id, "weapon-3");
});

test("regular values derive Hard and Extreme thresholds with floor rounding", () => {
  assert.deepEqual(getCoc7eThresholds(null), {
    regular: null,
    hard: null,
    extreme: null,
  });
  assert.deepEqual(getCoc7eThresholds(73), {
    regular: 73,
    hard: 36,
    extreme: 14,
  });
});

test("HP, MP, maximum SAN, and Insane threshold use approved sources", () => {
  const sheet = createDefaultCoc7eSheetData();
  sheet.characteristics.con = 55;
  sheet.characteristics.siz = 70;
  sheet.characteristics.pow = 63;
  sheet.vitals.sanity.starting = 61;
  sheet.vitals.sanity.current = 12;
  sheet.skills.fixed.cthulhuMythos.value = 17;

  assert.equal(getCoc7eMaximumHitPoints(sheet), 12);
  assert.equal(getCoc7eMaximumMagicPoints(sheet), 12);
  assert.equal(getCoc7eMaximumSanity(sheet), 82);
  assert.equal(getCoc7eInsaneThreshold(sheet), 12);

  sheet.vitals.sanity.current = 1;
  assert.equal(getCoc7eInsaneThreshold(sheet), 12);
});

test("Move follows STR/DEX/SIZ and age boundaries", () => {
  const sheet = createDefaultCoc7eSheetData();
  sheet.characteristics.siz = 50;

  sheet.characteristics.str = 40;
  sheet.characteristics.dex = 45;
  assert.equal(getCoc7eMove(sheet), 7);

  sheet.characteristics.str = 50;
  assert.equal(getCoc7eMove(sheet), 8);

  sheet.characteristics.dex = 50;
  assert.equal(getCoc7eMove(sheet), 9);

  sheet.identity.age = 39;
  assert.equal(getCoc7eMove(sheet), 9);
  sheet.identity.age = 40;
  assert.equal(getCoc7eMove(sheet), 8);
  sheet.identity.age = 49;
  assert.equal(getCoc7eMove(sheet), 8);
  sheet.identity.age = 50;
  assert.equal(getCoc7eMove(sheet), 7);
});

test("Build and Damage Bonus use every approved boundary", () => {
  const cases: readonly [number, number, string][] = [
    [64, -2, "-2"],
    [65, -1, "-1"],
    [84, -1, "-1"],
    [85, 0, "none"],
    [124, 0, "none"],
    [125, 1, "+1D4"],
    [164, 1, "+1D4"],
    [165, 2, "+1D6"],
    [204, 2, "+1D6"],
    [205, 3, "+2D6"],
    [284, 3, "+2D6"],
    [285, 4, "+3D6"],
    [364, 4, "+3D6"],
    [365, 5, "+4D6"],
  ];

  for (const [total, build, damageBonus] of cases) {
    const sheet = createDefaultCoc7eSheetData();
    sheet.characteristics.str = Math.floor(total / 2);
    sheet.characteristics.siz = total - sheet.characteristics.str;
    assert.deepEqual(getCoc7eBuildAndDamageBonus(sheet), { build, damageBonus });
  }
});

test("POW seeds only empty Starting SAN and preserves mutable current values", () => {
  const initial = createDefaultCoc7eSheetData();
  initial.vitals.hitPoints.current = 8;
  initial.vitals.magicPoints.current = 4;
  initial.vitals.sanity.current = 51;
  initial.vitals.luck.current = 32;
  initial.skills.fixed.occult.value = 65;

  const seeded = updateCoc7eCharacteristic(initial, "pow", 70);
  assert.equal(seeded.vitals.sanity.starting, 70);
  assert.equal(seeded.vitals.sanity.current, 51);
  assert.equal(seeded.vitals.magicPoints.current, 4);
  assert.equal(seeded.skills.fixed.occult.value, 65);

  seeded.vitals.sanity.starting = 45;
  const changed = updateCoc7eCharacteristic(seeded, "pow", 80);
  assert.equal(changed.vitals.sanity.starting, 45);
  assert.equal(changed.vitals.hitPoints.current, 8);
  assert.equal(changed.vitals.luck.current, 32);
});

test("the fixed skill catalogue and development exclusions are complete", () => {
  assert.equal(COC7E_FIXED_SKILLS.length, 39);
  assert.equal(new Set(COC7E_FIXED_SKILL_IDS).size, 39);
  assert.deepEqual(
    COC7E_FIXED_SKILLS.filter((skill) => !skill.developmentAllowed).map((skill) => skill.id),
    ["creditRating", "cthulhuMythos"],
  );
  assert.equal(COC7E_FIXED_SKILLS.find((skill) => skill.id === "firstAid")?.baseValue, 30);
  assert.equal(COC7E_FIXED_SKILLS.find((skill) => skill.id === "spotHidden")?.baseValue, 25);
  assert.equal(COC7E_FIXED_SKILLS.find((skill) => skill.id === "dodge")?.baseValue, "dexHalf");
});

test("Dodge and Language Own follow characteristics only while unset", () => {
  const sheet = createDefaultCoc7eSheetData();
  sheet.characteristics.dex = 65;
  sheet.characteristics.edu = 72;

  assert.equal(getCoc7eFixedSkillBase(sheet, "dodge"), 32);
  assert.equal(getCoc7eFixedSkillValue(sheet, "dodge"), 32);
  assert.equal(
    getCoc7eSpecialtyValue(sheet, "languageOwn", sheet.skills.specialties.languageOwn[0]),
    72,
  );

  sheet.skills.fixed.dodge.value = 50;
  sheet.skills.specialties.languageOwn[0].value = 80;
  sheet.characteristics.dex = 40;
  sheet.characteristics.edu = 45;
  assert.equal(getCoc7eFixedSkillValue(sheet, "dodge"), 50);
  assert.equal(
    getCoc7eSpecialtyValue(sheet, "languageOwn", sheet.skills.specialties.languageOwn[0]),
    80,
  );
});

test("static specialty bases stay in system definitions instead of JSONB", () => {
  const sheet = createDefaultCoc7eSheetData();

  assert.equal(sheet.skills.specialties.artCraft[0].baseValue, null);
  assert.equal(
    getCoc7eSpecialtyValue(sheet, "artCraft", sheet.skills.specialties.artCraft[0]),
    5,
  );
  assert.equal(sheet.skills.specialties.languageOther[0].baseValue, null);
  assert.equal(
    getCoc7eSpecialtyValue(
      sheet,
      "languageOther",
      sheet.skills.specialties.languageOther[0],
    ),
    1,
  );
  assert.equal(sheet.skills.specialties.survival[0].baseValue, null);
  assert.equal(
    getCoc7eSpecialtyValue(sheet, "survival", sheet.skills.specialties.survival[0]),
    10,
  );
});

test("specialty and weapon validation rejects unnamed custom values", () => {
  const sheet = createDefaultCoc7eSheetData();
  sheet.skills.specialties.custom[0].value = 30;
  sheet.weapons[0].skill = { kind: "custom", name: "", value: 45 };

  assert.deepEqual(validateCoc7eSheetData(sheet).sort(), [
    "specialtyNameRequired",
    "weaponSkillNameRequired",
  ]);

  sheet.skills.specialties.custom[0].specialty = "Hypnosis";
  sheet.weapons[0].skill = { kind: "custom", name: "Throw", value: 45 };
  assert.deepEqual(validateCoc7eSheetData(sheet), []);
});

test("weapon normalization keeps valid links and safely converts invalid links", () => {
  const valid = normalizeCoc7eSheetData({
    weapons: [{ skill: { kind: "linked", skillId: "fightingBrawl" } }],
  });
  assert.deepEqual(valid.weapons[0].skill, {
    kind: "linked",
    skillId: "fightingBrawl",
  });

  const invalid = normalizeCoc7eSheetData({
    weapons: [{ skill: { kind: "linked", skillId: "missing-skill" } }],
  });
  assert.deepEqual(invalid.weapons[0].skill, {
    kind: "custom",
    name: "missing-skill",
    value: null,
  });
});

test("normalized sheet data survives a JSON save/load round trip", () => {
  const sheet = createDefaultCoc7eSheetData();
  sheet.identity.occupation = "Professor";
  sheet.story = "A long investigation.";
  sheet.skills.specialties.science[0].specialty = "Chemistry";
  sheet.skills.specialties.science[0].value = 61;
  sheet.weapons[0].weapon = "Walking stick";
  sheet.weapons[0].skill = { kind: "linked", skillId: "fightingBrawl" };

  const roundTripped = normalizeCoc7eSheetData(
    JSON.parse(JSON.stringify(sheet)) as Coc7eSheetData,
  );
  assert.deepEqual(roundTripped, sheet);
});

test("CoC draft and active-page storage use a separate versioned namespace", () => {
  const values = new Map<string, string>();
  const sessionStorage = {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { sessionStorage },
  });

  try {
    const draftKey = getCoc7eCharacterDraftKey("character-1");
    const pageKey = getCoc7eCharacterPageKey("character-1");
    assert.match(draftKey, /call-of-cthulhu-7e/u);
    assert.match(getNewCoc7eCharacterDraftKey(), /call-of-cthulhu-7e/u);
    assert.match(getNewCoc7eCharacterPageKey(), /call-of-cthulhu-7e/u);

    const draft = {
      version: 1 as const,
      name: "Harvey Walters",
      visibility: "private" as const,
      activePage: "story" as const,
      sheetData: createDefaultCoc7eSheetData(),
    };
    writeCoc7eEditorDraft(draftKey, draft);
    writeCoc7eSheetPage(pageKey, "story");
    assert.deepEqual(readCoc7eEditorDraft(draftKey), draft);
    assert.equal(readCoc7eSheetPage(pageKey), "story");

    removeCoc7eEditorDraft(draftKey);
    assert.equal(readCoc7eEditorDraft(draftKey), null);
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
});

test("EN and RU CoC dictionaries have identical keys and approved Russian terms", () => {
  const english = JSON.parse(
    readFileSync(resolve("messages/en/call-of-cthulhu-7e.json"), "utf8"),
  ) as Record<string, unknown>;
  const russian = JSON.parse(
    readFileSync(resolve("messages/ru/call-of-cthulhu-7e.json"), "utf8"),
  ) as typeof english;

  function keys(value: unknown, prefix = ""): string[] {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return [prefix];
    }
    return Object.entries(value).flatMap(([key, child]) =>
      keys(child, prefix ? `${prefix}.${key}` : key),
    );
  }

  assert.deepEqual(keys(english).sort(), keys(russian).sort());
  const ruSheet = russian.Coc7eCharacterSheet as {
    skills: { fixed: Record<string, string>; specialties: Record<string, string> };
    conditions: Record<string, string>;
    backstory: Record<string, string>;
  };
  assert.equal(ruSheet.skills.fixed.accounting, "Бухгалтерское дело");
  assert.equal(ruSheet.skills.fixed.creditRating, "Средства");
  assert.equal(ruSheet.skills.fixed.spotHidden, "Внимание");
  assert.equal(ruSheet.skills.specialties.languageOwn, "Язык, родной");
  assert.equal(ruSheet.conditions.indefiniteInsanity, "Бессрочное безумие");
  assert.equal(ruSheet.backstory.ideologyBeliefs, "Идеалы и принципы");
});

test("the shared portrait contract keeps validation and owner/character paths", () => {
  const validFile = new File([new Uint8Array(16)], "portrait.png", {
    type: "image/png",
  });
  const invalidFile = new File([new Uint8Array(16)], "portrait.gif", {
    type: "image/gif",
  });

  assert.equal(validateCharacterPortraitFile(validFile), null);
  assert.equal(validateCharacterPortraitFile(invalidFile), "invalidType");
  assert.match(
    createCharacterPortraitPath("owner-id", "character-id", validFile),
    /^owner-id\/character-id\/.+\.png$/u,
  );
});

test("CoC character UI is wired into existing CRUD and campaign boundaries", () => {
  const creator = readFileSync(resolve("components/characters/character-creator.tsx"), "utf8");
  const editor = readFileSync(resolve("components/characters/character-editor.tsx"), "utf8");
  const listPage = readFileSync(resolve("app/[locale]/characters/page.tsx"), "utf8");
  const sheet = readFileSync(resolve("components/characters/sheets/call-of-cthulhu-7e/coc7e-character-sheet.tsx"), "utf8");
  const identity = readFileSync(resolve("components/characters/sheets/call-of-cthulhu-7e/identity-section.tsx"), "utf8");
  const navigation = readFileSync(resolve("components/characters/sheets/call-of-cthulhu-7e/sheet-page-navigation.tsx"), "utf8");
  const storyPage = readFileSync(resolve("components/characters/sheets/call-of-cthulhu-7e/story-sheet-page.tsx"), "utf8");
  const notice = readFileSync(resolve("components/characters/sheets/call-of-cthulhu-7e/fan-material-notice.tsx"), "utf8");
  const gameRoom = readFileSync(resolve("components/campaigns/campaign-game-room-workspace.tsx"), "utf8");
  const campaignCharacter = readFileSync(resolve("app/[locale]/campaigns/[id]/characters/[characterId]/page.tsx"), "utf8");
  const summaryCard = readFileSync(resolve("components/characters/character-summary-card.tsx"), "utf8");

  assert.match(creator, /Coc7eCharacterSheet/u);
  assert.match(creator, /normalizeCoc7eSheetData/u);
  assert.match(creator, /\.from\("characters"\)[\s\S]*\.insert\(/u);
  assert.match(editor, /Coc7eCharacterSheet/u);
  assert.match(editor, /normalizeCoc7eSheetData/u);
  assert.match(editor, /\.from\("characters"\)[\s\S]*\.update\(/u);
  assert.match(listPage, /cocIdentity/u);
  assert.match(sheet, /activePage === "investigator"/u);
  assert.match(sheet, /Coc7eFanMaterialNotice/u);
  assert.match(identity, /lg:grid-cols-\[27%_73%\]/u);
  assert.ok(identity.indexOf("SharedCharacterPortraitField") < identity.indexOf("identity.name"));
  assert.match(navigation, /grid grid-cols-2/u);
  assert.doesNotMatch(storyPage, /Fellow Investigators|Quick Reference Rules/u);
  assert.match(
    notice,
    /This website uses trademarks and\/or copyrights owned by Chaosium Inc\/Moon Design Publications LLC, which are used under Chaosium Inc’s Fan Material Policy\./u,
  );
  assert.match(notice, />\s*www\.chaosium\.com\s*</u);
  assert.match(editor, /setCocSheetData\(createDefaultCoc7eSheetData\(\)\)/u);
  assert.match(editor, /setCocActivePage\("investigator"\)/u);
  assert.match(summaryCard, /DeleteCharacterButton/u);
  assert.match(campaignCharacter, /<CharacterEditor[\s\S]*readOnly/u);
  assert.match(
    gameRoom,
    /<button type="button" disabled className=\{TOOL_BUTTON_CLASS\}>\s*\{translations\("tools\.character"\)\}/u,
  );
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const componentSource = readFileSync(
  resolve(
    "components/games/call-of-cthulhu-7e/dice-roller.tsx",
  ),
  "utf8",
);
const english = JSON.parse(
  readFileSync(resolve("messages/en.json"), "utf8"),
) as Record<string, unknown>;
const russian = JSON.parse(
  readFileSync(resolve("messages/ru.json"), "utf8"),
) as Record<string, unknown>;

function collectKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) =>
      collectKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

test("CoC UI renders simultaneous 3:2 panels with independent labels first", () => {
  assert.match(
    componentSource,
    /md:grid-cols-\[minmax\(0,3fr\)_minmax\(16rem,2fr\)\][\s\S]*<PercentilePanel[\s\S]*<OtherDicePanel/u,
  );
  assert.doesNotMatch(componentSource, /role=["']tab/u);
  const percentile = componentSource.slice(
    componentSource.indexOf("function PercentilePanel"),
    componentSource.indexOf("function OtherDiceResult"),
  );
  const other = componentSource.slice(
    componentSource.indexOf("function OtherDicePanel"),
    componentSource.indexOf("export default function"),
  );
  assert.ok(
    percentile.indexOf("<RollLabelField") <
      percentile.indexOf("<label htmlFor={targetId}"),
  );
  assert.ok(
    other.indexOf("<RollLabelField") <
      other.indexOf('htmlFor={`${id}-die-type`}'),
  );
  assert.match(percentile, /-percentile-roll-label/u);
  assert.match(other, /-other-roll-label/u);
  assert.equal(
    componentSource.match(
      /const \[label, setLabel\] = useState\(""\)/gu,
    )?.length,
    2,
  );
});

test("CoC UI uses the accepted generators and exact control defaults", () => {
  assert.match(componentSource, /rollCoc7ePercentileTest\(\{/u);
  assert.match(componentSource, /rollCoc7eOtherDice\(\{/u);
  assert.match(componentSource, /useState\(""\)/u);
  assert.match(componentSource, /useState<Coc7eBonusPenalty>\(0\)/u);
  assert.match(componentSource, /useState<Coc7eOtherDieSides>\(6\)/u);
  assert.match(componentSource, /const \[quantity, setQuantity\] = useState\(1\)/u);
  assert.match(componentSource, /const \[modifier, setModifier\] = useState\(0\)/u);
  assert.match(componentSource, /COC_7E_BONUS_PENALTY_VALUES\.map/u);
  assert.match(componentSource, /COC_7E_OTHER_DIE_SIDES\.map/u);
  assert.match(componentSource, /value === 0\s*\? "-"/u);
});

test("Percentile result uses the core snapshot and approved physical dice presentation", () => {
  assert.match(componentSource, /setResult\(evaluation\.result\)/u);
  assert.match(componentSource, /result\.request\.bonusPenalty > 0/u);
  assert.match(componentSource, /result\.selectedTensIndex/u);
  assert.match(componentSource, /value === 0 \? "00" : String\(value\)/u);
  assert.match(componentSource, /text-emerald-300/u);
  assert.match(componentSource, /text-red-300/u);
  assert.match(
    componentSource,
    /\[clip-path:polygon\(50%_2%,94%_34%,79%_88%,50%_100%,21%_88%,6%_34%\)\]/u,
  );
  assert.match(componentSource, /data-selected=\{isSelected/u);
});

test("Percentile result keeps only the rolled outcome while the live guide owns ranges", () => {
  assert.match(
    componentSource,
    /target !== null && outcome !== null/u,
  );
  assert.match(componentSource, /deriveCoc7eSuccessRanges\(target\)/u);
  assert.match(componentSource, /data-testid="coc-success-range-guide"/u);
  assert.match(componentSource, /formatSuccessRange/u);
  assert.doesNotMatch(componentSource, /percentile\.thresholds/u);
  assert.match(
    componentSource,
    /outcomes\.\$\{interpretation\.outcome\}/u,
  );
  assert.doesNotMatch(componentSource, /criticalThreshold|fumbleThreshold/u);
});

test("invalid Target and defensive errors preserve prior successful results", () => {
  const invalidTargetBranch = componentSource.match(
    /if \(parsedTarget === "invalid" \|\| !labelValidation\.ok\) \{([\s\S]*?)\n    \}/u,
  );
  assert.ok(invalidTargetBranch);
  assert.doesNotMatch(invalidTargetBranch[1], /setResult/u);

  const failedPercentileBranch = componentSource.match(
    /if \(!evaluation\.ok\) \{([\s\S]*?)\n        return;\n      \}/u,
  );
  assert.ok(failedPercentileBranch);
  assert.doesNotMatch(failedPercentileBranch[1], /setResult/u);
});

test("Other Dice uses bounded non-editable steppers and core result fields", () => {
  const otherPanelSource = componentSource.slice(
    componentSource.indexOf("function OtherDicePanel"),
  );

  assert.doesNotMatch(otherPanelSource, /type="number"/u);
  assert.match(componentSource, /disabled=\{value <= minimum\}/u);
  assert.match(componentSource, /disabled=\{value >= maximum\}/u);
  assert.match(componentSource, /const QUANTITY_MINIMUM = 1/u);
  assert.match(componentSource, /const QUANTITY_MAXIMUM = 10/u);
  assert.match(componentSource, /const MODIFIER_MINIMUM = -10/u);
  assert.match(componentSource, /const MODIFIER_MAXIMUM = 10/u);
  assert.match(componentSource, /\{result\.formula\}/u);
  assert.match(componentSource, /result\.results\.map/u);
  assert.match(componentSource, /modifier !== 0/u);
  assert.match(componentSource, /other\.total/u);
  assert.doesNotMatch(componentSource, /result\.subtotal/u);
});

test("result areas are absent before success and remain independent", () => {
  assert.match(
    componentSource,
    /result \? <PercentileResult result=\{result\} \/> : null/u,
  );
  assert.match(
    componentSource,
    /result \? <OtherDiceResult result=\{result\} \/> : null/u,
  );
  assert.doesNotMatch(componentSource, /Rolling|No rolls yet|spinner|skeleton/iu);
});

test("English and Russian CoC UI messages are complete and aligned", () => {
  const englishMessages = english.Coc7eDiceRoller;
  const russianMessages = russian.Coc7eDiceRoller;

  assert.ok(englishMessages);
  assert.ok(russianMessages);
  assert.deepEqual(
    collectKeys(englishMessages).sort(),
    collectKeys(russianMessages).sort(),
  );
});

test("English and Russian personal-history messages distinguish both CoC tools", () => {
  const englishMessages = english.PersonalRollHistory as Record<
    string,
    unknown
  >;
  const russianMessages = russian.PersonalRollHistory as Record<
    string,
    unknown
  >;
  assert.ok(englishMessages);
  assert.ok(russianMessages);
  assert.deepEqual(
    collectKeys(englishMessages).sort(),
    collectKeys(russianMessages).sort(),
  );
  const englishKinds = englishMessages.kinds as Record<string, string>;
  const russianKinds = russianMessages.kinds as Record<string, string>;
  for (const kind of ["coc_7e_percentile", "coc_7e_other_dice"]) {
    assert.ok(englishKinds[kind].trim());
    assert.ok(russianKinds[kind].trim());
  }
});

test("personal history renders typed summaries without raw JSON or campaign coupling", () => {
  const historySource = readFileSync(
    resolve("components/dice-rollers/personal-roll-history.tsx"),
    "utf8",
  );
  assert.match(historySource, /case "coc_7e_percentile"/u);
  assert.match(historySource, /case "coc_7e_other_dice"/u);
  assert.match(historySource, /deletePersonalRollAction/u);
  assert.match(historySource, /clearPersonalRollHistoryAction/u);
  assert.match(historySource, /getPersonalRollHistoryLabel/u);
  assert.match(historySource, /translations\("noLabel"\)/u);
  assert.doesNotMatch(historySource, /JSON\.stringify|requestData/u);
  assert.doesNotMatch(historySource, /GameRoom|campaign_id|Realtime/u);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  getVtmV5DiePresentation,
  getVtmV5DieSymbol,
  type VtmV5DieSymbolCategory,
} from "../../lib/game-systems/vtm-v5/dice-symbols";

const KNOWN_ASSETS = new Set([
  "/assets/world-of-darkness/vtm-v5/dice/regular-failure.png",
  "/assets/world-of-darkness/vtm-v5/dice/regular-success.png",
  "/assets/world-of-darkness/vtm-v5/dice/regular-critical.png",
  "/assets/world-of-darkness/vtm-v5/dice/hunger-bestial-failure.png",
  "/assets/world-of-darkness/vtm-v5/dice/hunger-failure.png",
  "/assets/world-of-darkness/vtm-v5/dice/hunger-success.png",
  "/assets/world-of-darkness/vtm-v5/dice/hunger-messy-critical.png",
]);

const KNOWN_CATEGORIES = new Set<VtmV5DieSymbolCategory>([
  "failure",
  "success",
  "critical",
  "bestial-failure",
  "messy-critical",
]);

test("every normal d10 value maps to its official display category", () => {
  const categories = Array.from({ length: 10 }, (_, index) =>
    getVtmV5DieSymbol("normal", index + 1).category,
  );

  assert.deepEqual(categories, [
    "failure",
    "failure",
    "failure",
    "failure",
    "failure",
    "success",
    "success",
    "success",
    "success",
    "critical",
  ]);
});

test("every Hunger d10 value maps to its official display category", () => {
  const categories = Array.from({ length: 10 }, (_, index) =>
    getVtmV5DieSymbol("hunger", index + 1).category,
  );

  assert.deepEqual(categories, [
    "bestial-failure",
    "failure",
    "failure",
    "failure",
    "failure",
    "success",
    "success",
    "success",
    "success",
    "messy-critical",
  ]);
});

test("the mapping uses only the selected official assets and known categories", () => {
  for (const kind of ["normal", "hunger"] as const) {
    for (let value = 1; value <= 10; value += 1) {
      const symbol = getVtmV5DieSymbol(kind, value);

      assert.equal(KNOWN_ASSETS.has(symbol.src), true);
      assert.equal(KNOWN_CATEGORIES.has(symbol.category), true);
    }
  }
});

test("changing representation preserves the roll snapshot data", () => {
  const roll = {
    normalDice: [1, 6, 10],
    hungerDiceResults: [1, 5, 9, 10],
    totalSuccesses: 7,
    margin: 2,
    summaryKey: "messy-critical",
  } as const;
  const before = JSON.stringify(roll);

  const symbols = [
    ...roll.normalDice.map((value) =>
      getVtmV5DiePresentation("normal", value, "symbols"),
    ),
    ...roll.hungerDiceResults.map((value) =>
      getVtmV5DiePresentation("hunger", value, "symbols"),
    ),
  ];
  const numbers = [
    ...roll.normalDice.map((value) =>
      getVtmV5DiePresentation("normal", value, "numbers"),
    ),
    ...roll.hungerDiceResults.map((value) =>
      getVtmV5DiePresentation("hunger", value, "numbers"),
    ),
  ];

  assert.equal(symbols.every(({ symbol }) => symbol !== null), true);
  assert.equal(numbers.every(({ symbol }) => symbol === null), true);
  assert.equal(JSON.stringify(roll), before);
  assert.deepEqual(
    symbols.map(({ value }) => value),
    numbers.map(({ value }) => value),
  );
});

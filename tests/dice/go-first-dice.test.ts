import assert from "node:assert/strict";
import test from "node:test";

import {
  GO_FIRST_DICE,
  GO_FIRST_DIE_IDS,
  rollGoFirstDice,
  type GoFirstRandomSource,
} from "../../lib/dice/go-first-dice";

const ARCHIVED_MEYER_SOLUTION =
  "abcdeedcbadcbeebcdaaaaecbddbceecbddbceaaaadcbeebcdabcdeedcbaaadcbeebcdabcdeedcbaaecdbbdceaecdbbdceaabcdeedcbadcbeebcdaaaaaaecbddbceaabceddecbdcebbecdaadcebbecdbceddecbaaecbddbceaaaaaadcebbecdaecdbbdceaabcdeedcbabcdeedcbaaecdbbdceadcebbecdaaaecbddbceabceddecbaaaadcebbecddcebbecdaaaabceddecbaecbddbcea";

function createSequenceSource(values: readonly number[]): {
  source: GoFirstRandomSource;
  calls: () => number;
} {
  let index = 0;

  return {
    source(target) {
      if (index >= values.length) {
        throw new Error("The deterministic random sequence was exhausted.");
      }
      target[0] = values[index];
      index += 1;
    },
    calls: () => index,
  };
}

function combinations<T>(values: readonly T[], size: number): T[][] {
  if (size === 0) return [[]];

  return values.flatMap((value, index) =>
    combinations(values.slice(index + 1), size - 1).map((tail) => [
      value,
      ...tail,
    ]),
  );
}

function permutations<T>(values: readonly T[]): T[][] {
  if (values.length === 0) return [[]];

  return values.flatMap((value, index) =>
    permutations([
      ...values.slice(0, index),
      ...values.slice(index + 1),
    ]).map((tail) => [value, ...tail]),
  );
}

function countStrictlyDescendingOutcomes(order: readonly number[]): number {
  let lowerFaces: readonly number[] = GO_FIRST_DICE[order[order.length - 1]];
  let lowerWays = lowerFaces.map(() => 1);

  for (let position = order.length - 2; position >= 0; position -= 1) {
    const currentFaces: readonly number[] = GO_FIRST_DICE[order[position]];
    const currentWays = currentFaces.map((face) =>
      lowerFaces.reduce(
        (total, lowerFace, index) =>
          lowerFace < face ? total + lowerWays[index] : total,
        0,
      ),
    );

    lowerFaces = currentFaces;
    lowerWays = currentWays;
  }

  return lowerWays.reduce((total, ways) => total + ways, 0);
}

test("the fixed face table is exactly the archived Paul Meyer solution", () => {
  assert.equal(ARCHIVED_MEYER_SOLUTION.length, 300);
  assert.equal(GO_FIRST_DICE.length, 5);
  assert.deepEqual(
    GO_FIRST_DICE.map((die) => die.length),
    [60, 60, 60, 60, 60],
  );

  const allFaces = GO_FIRST_DICE.flat();
  assert.equal(allFaces.every(Number.isInteger), true);
  assert.equal(allFaces.length, 300);
  assert.equal(new Set(allFaces).size, 300);
  assert.deepEqual(
    [...allFaces].sort((left, right) => left - right),
    Array.from({ length: 300 }, (_, index) => index + 1),
  );

  const encodedFaces = Array.from({ length: 300 }, (_, index) => {
    const dieIndex = GO_FIRST_DICE.findIndex((die) =>
      (die as readonly number[]).includes(index + 1),
    );
    return String.fromCharCode("a".charCodeAt(0) + dieIndex);
  }).join("");

  assert.equal(encodedFaces, ARCHIVED_MEYER_SOLUTION);
});

test("every permutation of every 2-5 die subset has the exact fair count", () => {
  const dieIndices = GO_FIRST_DICE.map((_, index) => index);
  const expectedCounts = new Map([
    [2, 1_800],
    [3, 36_000],
    [4, 540_000],
    [5, 6_480_000],
  ]);

  for (let subsetSize = 2; subsetSize <= 5; subsetSize += 1) {
    const expectedCount = expectedCounts.get(subsetSize)!;

    for (const subset of combinations(dieIndices, subsetSize)) {
      const orderingCounts = permutations(subset).map((ordering) =>
        countStrictlyDescendingOutcomes(ordering),
      );

      assert.equal(
        orderingCounts.every((count) => count === expectedCount),
        true,
        `Unequal ordering count for subset ${subset.join(",")}`,
      );
      assert.equal(
        orderingCounts.reduce((total, count) => total + count, 0),
        60 ** subsetSize,
      );
    }
  }
});

test("rolls support two through five players with stable distinct dice", () => {
  for (let playerCount = 2; playerCount <= 5; playerCount += 1) {
    const enteredNames = Array.from(
      { length: playerCount },
      (_, index) => `Named player ${index + 1}`,
    );
    const { source, calls } = createSequenceSource(
      Array.from({ length: playerCount }, () => 0),
    );
    const evaluation = rollGoFirstDice(
      { playerCount, playerNames: enteredNames },
      Array.from({ length: 5 }, (_, index) => `Player ${index + 1}`),
      source,
    );

    assert.equal(evaluation.ok, true);
    if (!evaluation.ok) continue;

    assert.equal(evaluation.result.turnOrder.length, playerCount);
    assert.equal(calls(), playerCount);
    assert.equal(
      new Set(evaluation.result.turnOrder.map((entry) => entry.value)).size,
      playerCount,
    );

    for (let index = 1; index < playerCount; index += 1) {
      assert.equal(
        evaluation.result.turnOrder[index - 1].value >
          evaluation.result.turnOrder[index].value,
        true,
      );
    }

    for (const entry of evaluation.result.turnOrder) {
      assert.equal(entry.dieId, GO_FIRST_DIE_IDS[entry.playerIndex]);
      assert.equal(entry.name, enteredNames[entry.playerIndex]);
      assert.equal(
        (GO_FIRST_DICE[entry.playerIndex] as readonly number[]).includes(
          entry.value,
        ),
        true,
      );
    }
  }
});

test("blank names use the supplied localized fallbacks", () => {
  const { source } = createSequenceSource([0, 0, 0]);
  const fallbacks = ["Игрок 1", "Игрок 2", "Игрок 3"];
  const evaluation = rollGoFirstDice(
    { playerCount: 3, playerNames: ["  ", "Alice", ""] },
    fallbacks,
    source,
  );

  assert.equal(evaluation.ok, true);
  if (!evaluation.ok) return;

  const namesByPlayer = [...evaluation.result.turnOrder]
    .sort((left, right) => left.playerIndex - right.playerIndex)
    .map((entry) => entry.name);
  assert.deepEqual(namesByPlayer, ["Игрок 1", "Alice", "Игрок 3"]);
});

test("invalid player requests consume no randomness", () => {
  const invalidRequests = [
    null,
    {},
    { playerCount: 1 },
    { playerCount: 6 },
    { playerCount: 2.5 },
    { playerCount: 2, playerNames: "Alice" },
    { playerCount: 2, playerNames: ["Alice", 42] },
  ];
  const { source, calls } = createSequenceSource([0]);

  for (const request of invalidRequests) {
    assert.equal(
      rollGoFirstDice(request, ["Player 1", "Player 2"], source).ok,
      false,
    );
  }
  assert.equal(calls(), 0);
});

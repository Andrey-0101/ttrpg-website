import {
  cryptoUint32RandomSource,
  generateUnbiasedInteger,
  type Uint32RandomSource,
} from "./secure-random";
import { isRecord, validateIntegerInRange } from "./validation";

export const GO_FIRST_PLAYER_LIMITS = {
  minimum: 2,
  maximum: 5,
} as const;

export const GO_FIRST_DIE_IDS = ["A", "B", "C", "D", "E"] as const;

// Paul Meyer's permutation-fair 5d60 configuration, discovered 2023-07-31.
// Face positions were decoded from the archived Go First Dice Wiki
// `significant_solutions` sequence and cross-checked against the independently
// published numeric table:
// https://web.archive.org/web/20231002203517/http://gofirstdice.ericharshbarger.org/doku.php?id=significant_solutions
// https://en.wikipedia.org/wiki/Go_First_Dice#Five_players
export const GO_FIRST_DICE = [
  [
    1, 10, 19, 20, 21, 22, 39, 40, 41, 42, 51, 60, 61, 62, 71, 80, 81,
    90, 99, 100, 109, 118, 119, 120, 121, 122, 123, 132, 133, 150, 151,
    168, 169, 178, 179, 180, 181, 182, 183, 192, 201, 202, 211, 220, 221,
    230, 239, 240, 241, 250, 259, 260, 261, 262, 279, 280, 281, 282, 291,
    300,
  ],
  [
    2, 9, 13, 16, 25, 28, 33, 36, 45, 48, 52, 59, 65, 68, 72, 79, 85,
    86, 94, 95, 101, 108, 112, 115, 126, 129, 134, 141, 145, 146, 155,
    156, 160, 167, 172, 175, 187, 188, 196, 197, 203, 210, 212, 219, 225,
    226, 234, 235, 244, 247, 251, 258, 266, 267, 274, 275, 283, 290, 294,
    297,
  ],
  [
    3, 8, 12, 17, 24, 29, 32, 37, 44, 49, 53, 58, 64, 69, 73, 78, 83,
    88, 92, 97, 102, 107, 111, 116, 125, 130, 135, 140, 143, 148, 153,
    158, 161, 166, 171, 176, 185, 190, 194, 199, 204, 209, 213, 218, 223,
    228, 232, 237, 243, 248, 252, 257, 264, 269, 272, 277, 284, 289, 293,
    298,
  ],
  [
    4, 7, 11, 18, 26, 27, 34, 35, 43, 50, 54, 57, 63, 70, 74, 77, 84,
    87, 93, 96, 103, 106, 110, 117, 127, 128, 137, 138, 142, 149, 152,
    159, 163, 164, 173, 174, 184, 191, 195, 198, 205, 208, 214, 217, 224,
    227, 231, 238, 245, 246, 254, 255, 263, 270, 271, 278, 286, 287, 295,
    296,
  ],
  [
    5, 6, 14, 15, 23, 30, 31, 38, 46, 47, 55, 56, 66, 67, 75, 76, 82,
    89, 91, 98, 104, 105, 113, 114, 124, 131, 136, 139, 144, 147, 154,
    157, 162, 165, 170, 177, 186, 189, 193, 200, 206, 207, 215, 216, 222,
    229, 233, 236, 242, 249, 253, 256, 265, 268, 273, 276, 285, 288, 292,
    299,
  ],
] as const;

export type GoFirstRandomSource = Uint32RandomSource;

export type GoFirstRollEntry = {
  playerIndex: number;
  dieId: (typeof GO_FIRST_DIE_IDS)[number];
  name: string;
  value: number;
};

export type GoFirstRollResult = {
  playerCount: number;
  turnOrder: GoFirstRollEntry[];
};

export type GoFirstRollErrorCode =
  | "invalid-request"
  | "invalid-player-count"
  | "invalid-player-names";

export type GoFirstRollEvaluation =
  | { ok: true; result: GoFirstRollResult }
  | { ok: false; error: GoFirstRollErrorCode };

export const cryptoGoFirstRandomSource: GoFirstRandomSource =
  cryptoUint32RandomSource;

export function rollGoFirstDice(
  input: unknown,
  fallbackNames: readonly string[],
  randomSource: GoFirstRandomSource = cryptoGoFirstRandomSource,
): GoFirstRollEvaluation {
  if (!isRecord(input)) {
    return { ok: false, error: "invalid-request" };
  }

  const countValidation = validateIntegerInRange(
    input.playerCount,
    GO_FIRST_PLAYER_LIMITS.minimum,
    GO_FIRST_PLAYER_LIMITS.maximum,
  );

  if (!countValidation.ok) {
    return { ok: false, error: "invalid-player-count" };
  }

  const playerNames = input.playerNames ?? [];
  if (!Array.isArray(playerNames) || fallbackNames.length < countValidation.value) {
    return { ok: false, error: "invalid-player-names" };
  }

  const activeNames: string[] = [];
  for (let index = 0; index < countValidation.value; index += 1) {
    const enteredName = playerNames[index];
    if (enteredName !== undefined && typeof enteredName !== "string") {
      return { ok: false, error: "invalid-player-names" };
    }

    const normalizedName = enteredName?.trim().replace(/\s+/gu, " ") ?? "";
    const fallbackName = fallbackNames[index];
    if (typeof fallbackName !== "string" || !fallbackName.trim()) {
      return { ok: false, error: "invalid-player-names" };
    }
    activeNames.push(normalizedName || fallbackName);
  }

  const turnOrder = Array.from(
    { length: countValidation.value },
    (_, playerIndex): GoFirstRollEntry => {
      const die = GO_FIRST_DICE[playerIndex];
      const faceIndex = generateUnbiasedInteger(0, die.length, randomSource);

      return {
        playerIndex,
        dieId: GO_FIRST_DIE_IDS[playerIndex],
        name: activeNames[playerIndex],
        value: die[faceIndex],
      };
    },
  ).sort((left, right) => right.value - left.value);

  return {
    ok: true,
    result: {
      playerCount: countValidation.value,
      turnOrder,
    },
  };
}

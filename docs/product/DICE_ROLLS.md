# Dice Rolls

## Status

**Personal roller implemented; shared campaign dice planned.**

The pure deterministic VtM V5 evaluator is implemented at `lib/game-systems/vtm-v5/dice-engine.ts`. The separate client-side generator is implemented at `lib/game-systems/vtm-v5/dice-roller.ts`, and the localized personal roller is available at `/[locale]/games/vampire-the-masquerade/tools/dice`. The `dice_rolls` table and shared campaign dice are not implemented.

Initial system:

```text
Vampire: The Masquerade Fifth Edition
```

Implementation order:

1. define and review the VtM result contract;
2. implement a pure deterministic evaluator;
3. add random generation and personal roller UI;
4. verify EN/RU and mobile;
5. design persisted campaign rolls;
6. add server-authoritative execution and Realtime feed.

## Product goals

The first dice tool should be fast, understandable, and useful during actual play.

It should support:

- personal VtM rolls;
- ordinary and Hunger dice;
- optional Difficulty;
- a readable result;
- individual dice;
- repeat roll;
- optional label;
- later character-assisted defaults;
- later campaign-shared history.

It does not need 3D physics, elaborate animation, or a universal expression language.

## Accepted architectural boundary

ADR-008 is Accepted.

The platform owns:

- authentication;
- campaign membership;
- persistence;
- server execution boundary;
- Realtime delivery;
- common timestamps and actor identity.

The VtM system owns:

- pool validation rules;
- Hunger behavior;
- die classification;
- success counting;
- critical interpretation;
- messy critical;
- bestial failure;
- readable VtM result terminology.

## Phase 1 request contract

The authoritative deterministic evaluator entry point is:

```ts
evaluateVtmV5Dice(input: unknown): VtmV5DiceEvaluation
```

Accepted input:

```text
request:
  pool
  hungerDice
  difficulty?
  label?
normalDice[]
hungerDiceResults[]
```

Validation rules:

- `pool` is an integer from 1 through 50;
- `hungerDice` is an integer from 0 through 5 and cannot exceed `pool`;
- optional `difficulty` is an integer from 1 through 20;
- optional `label` is trimmed, internal whitespace is collapsed, and an empty normalized label becomes `null`;
- a normalized label cannot exceed 120 Unicode code points;
- `normalDice.length` equals `pool - hungerDice`;
- `hungerDiceResults.length` equals `hungerDice`;
- every die is a finite integer from 1 through 10;
- unknown fields are rejected;
- numbers are never coerced, truncated, rounded, or clamped;
- expected invalid input returns typed validation errors and does not throw.

Potential later character-assisted input:

```text
characterId
attribute
skill
specialty
modifier
```

The roller must not mutate the character sheet.

## Phase 1 result contract

The deterministic evaluator accepts concrete die results and returns a discriminated success or validation-error result. Successful evaluation contains:

```text
gameSystem
request:
  pool
  hungerDice
  difficulty
  label
normalDice[]
hungerDiceResults[]
nonTenSuccessCount
tenCount
criticalPairCount
totalSuccesses
hasCriticalPair
isSuccess
isOrdinaryCritical
isMessyCritical
isTotalFailure
isBestialFailure
difficultyResult
margin
summaryKey
detailFlags
```

Validation errors contain a stable code, field path, and optional non-localized details. They do not contain display text or localization keys.

The returned dice arrays are copies. Mutating caller-owned arrays after evaluation cannot alter a result.

Important design rule:

> Random generation and result interpretation are separate.

Tests should supply fixed die arrays so the same input always produces the same interpretation.

## VtM interpretation

- Results 1 through 5 produce no success.
- Results 6 through 9 each produce one non-ten success.
- Every 10 produces one base success.
- All tens are paired across normal and Hunger dice.
- `criticalPairCount = floor(tenCount / 2)`.
- Each critical pair adds two bonus successes.
- `totalSuccesses = nonTenSuccessCount + tenCount + 2 * criticalPairCount`.
- An odd extra ten remains one success and sets `hasUnpairedTen`.
- Exact Difficulty succeeds with margin zero.
- Margin is `totalSuccesses - difficulty` and is not clamped.
- Bestial failure requires a determined failed test and a Hunger die showing 1.
- Total failure requires a determined failed test with zero successes.
- Total and bestial failure can both be true; bestial failure has summary precedence.
- A Hunger 1 on a successful test is detail only.
- Ordinary critical requires a successful determined test, a critical pair, and no Hunger 10.
- Messy critical requires a successful determined test, a critical pair, and at least one Hunger 10.
- A critical pair below Difficulty contributes bonus successes but is not a critical outcome.
- With omitted Difficulty, success and failure outcomes remain unresolved: `difficultyResult` is `not-set`, `isSuccess` and `margin` are `null`, and critical/failure outcome flags remain false.

Summary precedence for determined tests is bestial failure, messy critical, ordinary critical, total failure, success, then failure.

### Fixed evaluator examples

| Case | Pool / Hunger / Difficulty | Normal dice | Hunger dice | Expected |
|---|---|---|---|---|
| Ordinary success | `3 / 1 / 1` | `6, 4` | `7` | 2 successes; margin 1 |
| Exact Difficulty | `2 / 0 / 1` | `6, 2` | none | success; margin 0 |
| Below Difficulty | `3 / 1 / 3` | `6, 2` | `7` | failure; margin -1 |
| Total failure | `3 / 0 / 1` | `2, 3, 5` | none | zero successes; total failure |
| Ordinary critical | `4 / 1 / 4` | `10, 10, 2` | `6` | 5 successes; ordinary critical |
| Messy critical | `4 / 1 / 4` | `10, 2, 3` | `10` | 4 successes; messy critical |
| Multiple pairs | `5 / 1 / 8` | `10, 10, 10, 2` | `10` | 2 pairs; 8 successes; messy critical |
| Unpaired ten | `4 / 0 / 5` | `10, 10, 10, 2` | none | 1 pair; 5 successes; unpaired-ten detail |
| Bestial with successes | `4 / 1 / 3` | `6, 7, 2` | `1` | 2 successes; bestial failure |
| Total and bestial | `3 / 1 / 1` | `2, 3` | `1` | both flags; bestial summary |
| Hunger 1 on success | `3 / 1 / 1` | `6, 2` | `1` | success; Hunger-one detail only |
| Pair below Difficulty | `3 / 1 / 5` | `10, 10` | `2` | 4 successes; failure; no critical outcome |
| Omitted Difficulty | `3 / 1 / omitted` | `10, 6` | `10` | 5 successes; pair recorded; outcome unresolved |
| Zero Hunger | `2 / 0 / 1` | `6, 2` | none | success |
| Full-pool Hunger | `3 / 3 / 2` | none | `10, 10, 1` | 4 successes; messy critical |

Invalid fixed cases cover an out-of-range pool, Hunger above its range or pool, invalid die values, missing dice, and extra dice. Additional validation tests cover non-finite and non-integer numbers, numeric strings, unexpected fields, label normalization and length, multiple simultaneous errors, stable error ordering, and defensive array copies.

## Personal roller route

Implemented:

```text
/[locale]/games/vampire-the-masquerade/tools/dice
```

Personal slice:

- public access consistent with the existing VtM game landing page;
- local `crypto.getRandomValues` generation with rejection sampling;
- no database row;
- no campaign required;
- no Realtime subscription;
- mobile-friendly controls;
- EN/RU result text;
- repeat roll.

A client-generated result is acceptable only for this non-shared, non-persisted mode.

## Persisted campaign roll phase

Recommended route:

```text
/[locale]/campaigns/[id]/dice
```

Requirements:

- active campaign participant;
- server-authoritative random generation;
- server-authoritative VtM interpretation;
- structured request and result persistence;
- authenticated actor derived server-side;
- optional character association only when accessible;
- immutable ordinary history;
- Realtime feed scoped to the campaign;
- removed Player access loss;
- safe limits and errors.

## Candidate persisted record

Not implemented.

Candidate fields:

```text
id
campaign_id
session_id
user_id
character_id
game_system
visibility
label
request_data
result_data
created_at
```

Potential visibility:

```text
all_members
game_master_only
roller_only
```

Do not add visibility modes until their RLS behavior is fully specified.

## Campaign feed

Friend-alpha feed should show:

- Player;
- character when selected;
- label;
- pool;
- Hunger dice;
- individual dice;
- interpreted outcome;
- Difficulty result;
- timestamp.

Potential later filters:

- session;
- character;
- Player;
- visibility.

## Security and integrity

For persisted rolls:

- require campaign membership;
- derive user identity from the authenticated request;
- verify selected character access;
- validate bounds;
- do not accept client-authored result interpretation;
- do not let ordinary clients rewrite history;
- scope Realtime subscriptions;
- add rate limiting before public exposure.

See `docs/architecture/SECURITY.md`.

## Testing strategy

### Unit tests

Use fixed die arrays for:

- all interpretation cases;
- invalid input;
- critical pairing;
- Hunger-specific outcomes;
- Difficulty and margin.

### UI tests

- keyboard;
- mobile;
- EN/RU;
- repeated submission;
- readable individual dice;
- omitted Difficulty;
- invalid input messaging.

### Campaign integration tests

- GM;
- Player;
- removed Player;
- Outsider;
- selected own character;
- selected shared character where policy permits;
- inaccessible character;
- Realtime consistency;
- immutable persisted result.

## Deferred work

- 3D dice;
- sound;
- physics simulation;
- macros;
- saved formulas;
- Discipline automation;
- arbitrary multi-system expressions;
- moderation tooling;
- export and advanced analytics.

## Completion criteria

### Personal roller

1. Pure evaluator is tested with fixed outcomes.
2. Hunger dice are distinct.
3. Difficulty is optional.
4. Result text is understandable.
5. EN/RU works.
6. Mobile controls work.
7. No persistence is implied.

### Shared campaign dice

1. Campaign membership is enforced.
2. Server produces and persists the result.
3. All authorized viewers receive the same result.
4. History cannot be silently changed.
5. Removed Players and Outsiders are denied.

# Dice Rolls

## Status

**Phase 4A personal VtM roller, Custom Dice Pool, saved presets, and private personal history are implemented in Production. Phase 4D1 CoC personal dice and its contextual-navigation, scoped-history, and live Target-band UX follow-up are also deployed. Phase 4D2 system-aware Game Room dice remains planned.**

The pure deterministic VtM V5 evaluator is implemented at `lib/game-systems/vtm-v5/dice-engine.ts`. The separate client-side generator is implemented at `lib/game-systems/vtm-v5/dice-roller.ts`. The generic custom-pool generator is implemented at `lib/dice/custom-dice-pool.ts`. Shared strict validation primitives live at `lib/dice/validation.ts`, and shared unbiased secure integer generation lives at `lib/dice/secure-random.ts`. Phase 4D1 adds the CoC evaluators and generators under `lib/game-systems/call-of-cthulhu-7e/`.

The public hub is available at `/[locale]/dice-rollers`, the localized personal VtM roller is available at `/[locale]/games/vampire-the-masquerade/tools/dice`, the localized Custom Dice Pool is available at `/[locale]/dice-rollers/custom`, and the deployed CoC route is `/[locale]/games/call-of-cthulhu/tools/dice`. Personal persistence is implemented and remains non-authoritative. The `dice_rolls` table and campaign-authoritative Game Room dice are not implemented.

Campaign-authorized LiveKit video, the responsive Game Room, Phase 4C1 Campaign Gallery, Phase 4C2 Game Room Image Presentation, and Phase 4D1 with its UX follow-up are complete in Production. Dice resumes in Phase 4D2 with system-aware Game Room integration.

Initial system:

```text
Vampire: The Masquerade Fifth Edition
```

Implementation order:

1. complete the reviewed VtM result contract, pure deterministic evaluator, client-side random generation, personal roller UI, EN/RU, and mobile support in Phase 4A;
2. complete reviewed owner-scoped personal persistence, saved Custom Dice Pool presets, and private personal history in Phase 4A;
3. preserve the completed campaign Game Room and keep unavailable controls visibly disabled;
4. preserve the deployed CoC 7e personal dice engine, roller, and scoped UX follow-up from Phase 4D1;
5. integrate the correct system roller into the Game Room in Phase 4D2: VtM for VtM campaigns and CoC for CoC campaigns;
6. add persisted or realtime campaign history only if the Phase 4D2 design approves a server-authoritative schema, execution boundary, and RLS contract.

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

The deployed CoC 7e system owns its percentile and Other Dice request contracts, validation/error mapping, deterministic interpretation, result structures, and localized terminology. Shared validation and secure-random helpers contain only behavior proven common across VtM, Custom, and CoC; they do not form a universal rules engine.

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

Public hub:

```text
/[locale]/dice-rollers
```

The Production hub links to the implemented VtM V5, Custom Dice Pool, and CoC 7e rollers. Current inbound links attach a validated `returnTo` source so Back returns to the same-locale internal section that opened the roller; missing, invalid, external, protocol-relative, or locale-conflicting destinations fall back to the localized Dice Rollers catalogue.

Implemented:

```text
/[locale]/games/vampire-the-masquerade/tools/dice
/[locale]/dice-rollers/custom
/[locale]/games/call-of-cthulhu/tools/dice
```

Personal dice behavior:

- public rolling without authentication, consistent with the existing VtM game landing page;
- client-side `crypto.getRandomValues` generation with rejection sampling;
- client-side deterministic evaluation and non-authoritative results;
- non-persistent guest rolls;
- best-effort private personal-history recording for registered users;
- no campaign required;
- no Realtime subscription;
- mobile-friendly controls;
- EN/RU result text;
- official symbolic dice display by default with a page-lifetime Numbers option;
- repeat roll.

Personal results remain client-generated and non-authoritative even when best-effort personal persistence records them for a registered user. Personal history is owner-scoped, is not campaign evidence, and must not be reused as the Phase 4D2 campaign execution path.

The official symbol provenance and numeric display mapping are recorded in `docs/architecture/WORLD_OF_DARKNESS_ASSETS.md`. Display selection never changes the evaluator result or reruns random generation.

## Custom Dice Pool

The public Custom Dice Pool supports Coin (`d2`), `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, and `d100`, in that display order. Every quantity may be zero, but a roll must contain at least one coin or numeric die. A pool is limited to 100 rolled items in total; this is large enough for practical tabletop pools while bounding browser work and the amount of rendered result UI.

Each item is generated independently in the browser with `crypto.getRandomValues`, using the same injectable random source for deterministic tests. Coin outcomes use the typed values `heads` and `tails`, mapped to two exactly equal halves of the uint32 sample space. Numeric dice use rejection sampling to remove modulo bias for every supported die size. The generator validates the complete request before consuming randomness and returns copied quantities and result arrays.

The UI:

- allows guests and registered users to roll without requiring authentication;
- groups Coin outcomes separately from numeric dice and reports Heads/Tails counts;
- reports total rolled items and a numeric-dice total that excludes coins and is hidden for coin-only pools;
- supports direct numeric input and keyboard-accessible increment/decrement controls;
- keeps the most recent result as a snapshot when form quantities change;
- replaces the result only after another valid Roll action;
- clears configuration and results explicitly;
- keeps client-side generation independent from campaigns, Realtime, and named-game interpretation;
- adds authentication only for saved presets and private personal history;
- preserves the visible local result when best-effort persistence is unavailable or fails.

## Implemented personal-tool persistence

- guest and authenticated access to public system rollers and the Custom Dice Pool is implemented;
- guest rolls remain non-persistent;
- registered users may save up to 5 custom dice presets;
- saved custom presets preserve the selected Coin quantity as well as every numeric dice quantity;
- registered-user personal history retains up to six rows per owner per roller kind;
- personal persistence is owner-scoped and best-effort rather than guaranteed for every roll;
- personal roll history remains private, non-authoritative, and separate from future campaign roll history;
- personal records are not campaign evidence and must not be reused as the Phase 4D2 campaign execution path;
- persistence was delivered through its reviewed schema, migration, RLS, and UI phase.

The application registry records four supported schema-version-1 kinds:

```text
vtm_v5
custom_dice_pool
coc_7e_percentile
coc_7e_other_dice
```

The deployed UX follow-up removes history from the generic catalogue and renders it only on the matching roller page: VtM shows `vtm_v5`, Custom shows `custom_dice_pool`, and CoC chronologically mixes only `coc_7e_percentile` and `coc_7e_other_dice`. Each kind shows its current in-memory result plus up to five previous persisted entries without duplication. Individual Delete remains row-specific. Clear History is owner-scoped to the current page's one or two kinds and cannot clear unrelated roller history.

The deployed database envelope requires `roller_kind` to match `^[a-z][a-z0-9_]{0,63}$` and `schema_version` to be positive. Those constraints do not declare application support. The application registry remains authoritative for supported kind/version pairs, revalidates each payload, and safely skips malformed or unknown rows. The applied `20260907114535_scope_personal_roll_history_by_kind.sql` migration changes prospective pruning from a combined owner timeline to six rows per owner per kind, adds the matching query index, and adds scoped clearing without removing the existing clear-all RPC.

## Phase 4D1 — CoC 7e Dice Roller

**Deployed in Production, including the UX follow-up.**

The standalone EN/RU route presents two responsive panels: Percentile and Other Dice. Guest rolls remain local and non-persistent. Authenticated rolls display immediately and are then recorded asynchronously through the existing best-effort personal-history path; a persistence failure does not remove or invalidate the local result.

### Percentile contract

- target is optional; without it the roller reports the raw percentile result and no success interpretation;
- a supplied target is an integer from 1 through 100; there is no separate Difficulty or Label input;
- bonus/penalty is an integer from -3 through +3; support for three dice in either direction is an intentional product extension;
- the physical model uses one units die, one base tens die, and one additional tens die per absolute bonus/penalty value;
- tens faces are `00`, `10`, ..., `90`, and `00` with units `0` means 100;
- bonus selects the lowest complete percentile candidate and penalty selects the highest;
- `tensDice[0]` records the base die's identity only and receives no tie priority; `selectedTensIndex` preserves the selected die index;
- with a target, outcome precedence is Critical, Fumble, Extreme, Hard, Regular, then Failure;
- 01 is Critical;
- Fumble is 96–100 when the target is below 50, and 100 when the target is 50 or greater.

The deployed follow-up adds a live row beneath the Target controls. Before a valid Target is present, all six full outcome labels show `-`. For a valid Target, the deterministic engine supplies Critical `= 01`, Extreme `≤ floor(Target / 5)`, Hard `≤ floor(Target / 2)`, Regular `≤ Target`, the applicable Failure interval or `-`, and the applicable Fumble interval. Editing Target updates this guide without a roll. The former Target/Hard/Extreme line beneath the physical dice is removed; physical dice, selected Tens presentation, large result, and evaluator precedence remain unchanged.

### Other Dice contract

- supported dice are D2, D3, D4, D6, D8, D10, D20, and D100; D12 is deliberately not included;
- quantity is an integer from 1 through 10;
- modifier is an integer from -10 through +10;
- each roll uses one die type and returns the canonical formula, ordered die results, the modifier when nonzero, and Total;
- negative totals are valid;
- this is a CoC tool and is not the system-neutral Custom Dice Pool.

Both generators use `crypto.getRandomValues` through the shared unbiased rejection-sampling helper and pass generated values into deterministic evaluators. Expected invalid input returns typed validation results rather than being coerced, clamped, or interpreted from display text.

Phase 4D1 extends only personal, client-generated convenience history. It does not create campaign-authoritative history, campaign-scoped execution, Realtime delivery, or Game Room integration.

Phase 4D1 and its UX follow-up passed complete local application, database, and browser verification and are deployed. Preview and Production guest acceptance passed, including contextual Back destinations, scoped-history placement, CoC Target bands, and mobile containment. Authenticated Production persistence acceptance remains pending because no authorized signed-in Production browser session was available; no application defect was demonstrated.

## Phase 4D2 — System-aware Game Room dice

Recommended route:

```text
/[locale]/campaigns/[id]/dice
```

Requirements:

- active campaign participant;
- derive the campaign game system server-side;
- use VtM rules for VtM campaigns and CoC rules for CoC campaigns;
- never expose an incompatible system roller;
- server-authoritative random generation;
- server-authoritative system-specific interpretation if persisted or shared history is approved;
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
7. Guest rolls remain non-persistent, while registered-user persistence is private, owner-scoped, and best-effort.
8. Personal results remain non-authoritative and are never treated as campaign evidence or the Phase 4D2 campaign execution path.

### Phase 4D2 Game Room dice

1. Campaign membership is enforced.
2. Server produces and persists the result.
3. All authorized viewers receive the same result.
4. History cannot be silently changed.
5. Removed Players and Outsiders are denied.

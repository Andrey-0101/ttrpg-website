# Dice Rolls

## Status

**Active design and next implementation target.**

No dice engine or `dice_rolls` table is implemented in the synchronized repository snapshot.

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

Recommended personal VtM request:

```text
pool
hungerDice
difficulty?
label?
```

Constraints to review before code:

- pool minimum and maximum;
- Hunger minimum and maximum;
- `hungerDice <= pool`;
- Difficulty minimum and maximum;
- label length;
- whether zero-die pools are allowed in UI or only evaluator tests.

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

The deterministic evaluator should accept concrete die results and return structured data.

Recommended shape:

```text
gameSystem
pool
hungerDice
difficulty
normalDice[]
hungerDiceResults[]
successes
criticalPairCount
isCritical
isMessyCritical
isBestialFailure
isTotalFailure
meetsDifficulty
margin
summaryKey
detailFlags
```

The final field names should be reviewed before implementation.

Important design rule:

> Random generation and result interpretation are separate.

Tests should supply fixed die arrays so the same input always produces the same interpretation.

## VtM interpretation cases to cover

At minimum:

- ordinary success;
- failure with some successes below Difficulty;
- total failure;
- ordinary critical;
- messy critical;
- bestial failure;
- critical without Difficulty;
- exact Difficulty;
- positive and negative margin;
- Hunger dice that roll 1 without a failed test;
- multiple tens and critical pairing;
- invalid pool/Hunger combinations.

The exact intended VtM V5 interpretation must be approved before code is treated as authoritative.

## Personal roller route

Recommended:

```text
/[locale]/games/vampire-the-masquerade/tools/dice
```

First slice:

- authenticated or public access decision reviewed explicitly;
- local random generation;
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

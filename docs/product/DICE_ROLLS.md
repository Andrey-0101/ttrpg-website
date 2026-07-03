# Dice Rolls

## Status

Proposed architecture. No dice-roll engine or database table is implemented.

Initial implementation target:

```text
Vampire: The Masquerade Fifth Edition
```

## Product goals

The first dice tool should be fast, understandable, and useful during actual play.

It should support:

- personal VtM rolls;
- rolls initiated from a character;
- later campaign-shared rolls;
- a readable result;
- detailed individual dice;
- optional Difficulty;
- Hunger dice;
- repeat roll.

It does not need 3D physics or elaborate animation.

## Architectural boundary

Use a small common contract with a VtM implementation.

Conceptual shape:

```text
Dice request
Dice result
Display summary
Detailed dice
Game system
User
Character
Campaign
Timestamp
Visibility
```

Do not create a universal expression language for every TTRPG in the first implementation.

## VtM V5 input

Candidate input:

```text
normalDice
hungerDice
difficulty
label
characterId
campaignId
visibility
```

Potential future character-assisted input:

```text
attribute
skill
specialty
modifier
```

The exact VtM result interpretation must be defined and reviewed against the intended rules before implementation.

## Execution modes

### Personal local roll

Use case:

- user opens the roller outside a campaign;
- no shared history is required.

A client-generated result may be acceptable for this limited mode.

### Persisted campaign roll

Use case:

- all campaign members must see the same result;
- result appears in a shared feed.

Recommended behavior:

- authorization and random result are produced through trusted server-side execution;
- result is persisted;
- the feed uses realtime delivery;
- the original detailed result cannot be silently replaced by the client.

## Proposed persisted record

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

Do not add visibility modes until their RLS behavior is clearly defined.

## Campaign feed

Friend-alpha feed should show:

- player;
- character;
- roll label;
- dice pool;
- Hunger dice;
- individual dice;
- interpreted outcome;
- Difficulty result when supplied;
- timestamp.

Potential filters:

- session;
- character;
- player;
- visibility.

## Integration with character sheets

A VtM character sheet may open the roller with:

- current character selected;
- current Hunger suggested;
- selected Attribute and Skill suggested.

The roller must not silently mutate the character sheet.

## Security and integrity

For persisted rolls:

- require campaign membership;
- confirm the selected character is accessible to the user;
- do not trust client-provided user identity;
- validate pool limits;
- rate-limit before public release;
- store structured request/result data;
- do not allow ordinary clients to rewrite historical outcomes.

## Deferred work

- 3D dice;
- sound;
- physics simulation;
- macros;
- saved formulas;
- full automation of Discipline powers;
- arbitrary multi-system expressions;
- moderation and anti-abuse tooling;
- export and advanced analytics.

## Completion criteria for the first VtM roller

1. Personal roll works without a campaign.
2. Hunger dice are visually distinct.
3. Difficulty can be omitted or supplied.
4. The result is understandable without rule-engine debugging output.
5. A character can open the tool with useful defaults.
6. Campaign mode checks membership.
7. All campaign viewers receive the same persisted result.
8. EN/RU labels work.
9. Mobile controls are usable.

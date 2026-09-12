# Character Sheets

## Scope

This document records the current common character architecture and the implemented Vampire: The Masquerade Fifth Edition and Call of Cthulhu Seventh Edition sheets.

## Common character model

Common character data is stored in `public.characters`.

Common fields include:

```text
id
owner_id
name
game_system
description
portrait_url
visibility
sheet_data
created_at
updated_at
```

Do not duplicate common fields inside system-specific `sheet_data`.

## Game systems

Current IDs:

```text
vtm-v5
call-of-cthulhu-7e
```

Current status:

| System | Status |
|---|---|
| `vtm-v5` | Implemented |
| `call-of-cthulhu-7e` | Implemented / deployed / Production acceptance pending |

## VtM V5 schema

Current version:

```text
3
```

Source:

```text
lib/characters/vtm-v5/schema.ts
```

Key functions:

```text
createDefaultVtmV5SheetData()
normalizeVtmV5SheetData()
```

All persisted VtM data must be normalized before use.

## VtM V5 data contract

```text
schemaVersion: 3

identity:
  clan
  concept
  predatorType
  sire
  generation
  sect
  ambition
  desire
  chronicle

attributes:
  strength
  dexterity
  stamina
  charisma
  manipulation
  composure
  intelligence
  wits
  resolve

skills:
  athletics
  brawl
  craft
  drive
  firearms
  larceny
  melee
  stealth
  survival
  animalKen
  etiquette
  insight
  intimidation
  leadership
  performance
  persuasion
  streetwise
  subterfuge
  academics
  awareness
  finance
  investigation
  medicine
  occult
  politics
  science
  technology

skillSpecialties:
  partial map from skill key to string array

disciplines:
  id
  name
  dots
  powers[]
  notes

advantages:
  id
  name
  dots
  category: background | merit | flaw | other
  notes

trackers:
  resonance
  hunger
  humanity
  stains
  bloodPotency
  health:
    superficial
    aggravated
    bonus
  willpower:
    superficial
    aggravated
    bonus

chronicleTenets[]
convictions[]
touchstones[]
clanBane

bloodPotencyDetails:
  bloodSurge
  mendAmount
  powerBonus
  rouseReRoll
  feedingPenalty
  baneSeverity

experience:
  total
  spent

biography:
  trueAge
  apparentAge
  dateOfBirth
  dateOfDeath
  appearance
  distinguishingFeatures
  history

notes
extensions
```

## Backward compatibility

The normalizer:

- accepts legacy top-level `clan`;
- accepts legacy top-level `hunger`;
- accepts legacy top-level `resonance`;
- fills missing fields;
- clamps ratings and trackers;
- preserves unknown top-level data in `extensions`;
- preserves empty dynamic rows when a stable row ID provides identity.

Do not bypass normalization when loading persisted data.

## CoC 7e schema

Current version:

```text
1
```

Source:

```text
lib/characters/call-of-cthulhu-7e/schema.ts
lib/characters/call-of-cthulhu-7e/definitions.ts
```

The schema stores CoC-specific identity, the eight editable characteristics, mutable vitals, conditions, fixed and specialty skill state, weapons, Story, Backstory, Gear & Possessions, Wealth, and `extensions`. Fixed skill bases and specialty-category defaults belong to system definitions rather than every character payload. Specialty and weapon rows use stable IDs.

The normalizer always returns `schemaVersion: 1`, restores required slots, accepts only finite integers in the technical `0..999` range, treats invalid numeric data as `null`, accepts only strict booleans, preserves long strings, de-duplicates row IDs, preserves unknown top-level data in `extensions`, and converts an invalid linked weapon skill to a visible custom value rather than silently discarding its identifier.

Calculated values are never persisted separately:

```text
Hard = floor(Regular / 2)
Extreme = floor(Regular / 5)
Idea = INT
Know = EDU
Maximum HP = floor((CON + SIZ) / 10)
Maximum MP = floor(POW / 5)
Maximum SAN = 99 - Cthulhu Mythos
Insane threshold = floor(Starting SAN / 5)
Move = the accepted STR/DEX/SIZ and Age table
Build and Damage Bonus = the accepted STR + SIZ table
```

Changing POW seeds an empty Starting SAN once. It does not overwrite Starting SAN after that point or mutate Current SAN. Current HP, MP, SAN, Luck, and explicitly entered skills remain mutable and are not recalculated when source characteristics change. Dodge derives from half DEX while unset; Language Own derives from EDU while unset. Credit Rating and Cthulhu Mythos cannot retain development marks.

## VtM page structure

Logical pages:

```text
core
background
```

### Core page

Contains:

- identity card;
- portrait;
- Attributes;
- Health and Willpower;
- Skills and Specialties;
- Resonance;
- Hunger;
- Humanity and Stains;
- Disciplines.

### Background page

Contains:

- Advantages and Flaws;
- Chronicle Tenets;
- Touchstones and Convictions;
- Clan Bane;
- Blood Potency details;
- Experience;
- Notes;
- Biography.

Biography history remains the final lower long-form field.

## CoC page structure

Logical pages:

```text
investigator
story
```

The Investigator page uses an upper-left portrait and identity zone, horizontal Characteristics and Skills sections in the existing site style, derived/status values, a three-column desktop Skills region, a read-only Brawl combat row, and three initial editable weapon rows. Weapon rows may link to a valid sheet skill or store a named custom skill; notation-bearing fields remain strings.

The Story page contains Story, the ten approved Backstory fields in a two-column desktop area, Gear & Possessions, and string-based Spending Level, Cash, and Assets. It has no Fellow Investigators or Quick Reference Rules section.

Both pages use content-driven mobile height and a single two-control page-navigation row. The supplied standard autocalc PDF is a functional/compositional reference only: the implementation does not reproduce its logo, fonts, decorative assets, official trade dress, or endorsement. The exact required Chaosium Fan Material Policy notice appears beneath every rendered CoC sheet in a plainly legible accessible region.

## Responsive rendering

Desktop:

- A4-oriented proportions;
- multi-column layout;
- framed white sheet.

Mobile and tablet:

- content-driven height;
- stacked reading order;
- no rigid A4 aspect;
- one-column Disciplines;
- touch-friendly dots and damage boxes;
- responsive portrait and identity layout.

The data contract must remain independent from both layouts.

## View and edit behavior

Current model:

- separate view and edit modes;
- explicit Save;
- top and bottom action controls;
- Add/Remove controls only in edit mode;
- local browser-tab draft;
- active-page restoration.

VtM and CoC use separate versioned draft namespaces and page-state keys.

Current draft limitation:

- portrait `File` objects are not serialized;
- a selected unsaved portrait is lost on refresh or a remount.

Friend-alpha improvement:

- add an explicit warning for unsaved changes and unsaved portrait selection.

## Portrait behavior

Accepted formats:

```text
image/jpeg
image/png
image/webp
```

Maximum:

```text
5 MB
```

View mode displays a signed private URL or a neutral placeholder.

The current renderer uses cover-style image fitting. Crop and focal-point controls are deferred.

## Combined Touchstones and Convictions

Current UI displays a single combined field.

Current persistence behavior after editing:

```text
all visible lines -> touchstones
convictions -> []
```

This is a known semantic limitation. It must be reviewed before any future schema revision. Responsive or cosmetic changes must not silently alter the behavior.

## Trackers

Humanity fills from the left.

Stains are represented from the right as red slashes.

Damage distinguishes:

```text
superficial
aggravated
bonus capacity
```

Tracker controls must remain keyboard-accessible and touch-friendly.

## Validation principles

Hard validation should cover:

- required character name;
- technical data shape;
- configured rating ranges;
- tracker ranges;
- non-negative experience;
- portrait type and size.

Game-creation conventions should generally be warnings rather than universal hard blocks because the application may store:

- starting characters;
- experienced characters;
- NPCs;
- non-standard chronicles;
- fresh-embrace characters.

The schema must allow empty Clan, Sire, Predator Type, and Disciplines.

## Visibility

Current values:

```text
private
campaign
public
```

Current behavior:

| Value | Access |
|---|---|
| `private` | owner only |
| `campaign` | owner; plus active campaign participants when an active eligible assignment exists |
| `public` | owner only; no public route or public RLS policy exists |

Campaign visibility alone does not share a character.

Campaign-derived read access also requires:

- an active campaign;
- an active `campaign_characters` assignment;
- matching character and campaign game systems;
- continued participation by the character owner;
- current participation by the viewer.

Campaign participants receive read-only access through the campaign character route. Only the owner can edit or delete the character.

The owner or campaign Game Master may unlink an active assignment. Unlinking never deletes the character.

## Deferred work

- independent sheet language;
- print/PDF;
- portrait crop/focal point;
- complex autosave;
- history/versioning;
- public read-only renderer;
- final decorative frame.

## Adding a future system

A new game system should provide:

1. a stable system ID;
2. a versioned data contract;
3. safe defaults;
4. a normalizer;
5. a sheet renderer;
6. a summary renderer;
7. EN/RU messages;
8. responsive behavior;
9. tests for migration and persistence;
10. optional dice and theme adapters.

Do not modify the VtM schema to accommodate unrelated systems.

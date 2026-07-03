# Character Sheets

## Scope

This document records the current common character architecture and the implemented Vampire: The Masquerade Fifth Edition sheet.

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
| `call-of-cthulhu-7e` | Registered but unavailable |

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

## Current page structure

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

The data values exist, but current access remains owner-only.

The character UI must not promise real campaign/public sharing until routes and RLS implement it.

## Deferred work

- independent sheet language;
- print/PDF;
- portrait crop/focal point;
- autosave;
- history/versioning;
- public read-only renderer;
- campaign permissions;
- final decorative frame;
- CoC character sheet.

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

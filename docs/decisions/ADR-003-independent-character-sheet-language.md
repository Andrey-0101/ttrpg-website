# ADR-003: Independent Character-Sheet Language

- Status: Proposed
- Date: 2026-07-02

## Context

A user may prefer the site interface in one language while keeping a character sheet in another. The current VtM sheet follows the route locale.

## Proposed decision

Treat route locale and sheet language as independent values.

Route locale controls:

- navigation;
- account/auth UI;
- common actions;
- common errors;
- page chrome.

Sheet language controls:

- game-system field labels;
- game terminology;
- future print/export;
- system-specific help.

## Unresolved implementation

Before acceptance, decide:

- dedicated `sheet_language` column or system data field;
- default for existing records;
- creation UI;
- whether the value can change;
- whether changing language affects only labels;
- independent dictionary-loading design.

## Consequences

Positive:

- multilingual play is practical;
- route switching does not redefine a saved sheet;
- print/export behavior is predictable.

Costs:

- two language contexts can exist on one page;
- dictionaries may need independent loading;
- migration/default behavior is required;
- metadata and common UI remain route-localized.

## Alternatives considered

### Always use route locale

Current behavior, but it does not meet the accepted product concept.

### Store translated user-entered values

Rejected as a general solution. User content is not automatically translated.

## Follow-up

Accept this ADR before implementing a database migration or selector.

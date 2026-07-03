# ADR-005: URL-Prefixed Localization

- Status: Accepted
- Date: 2026-07-02

## Context

The site requires stable English and Russian URLs, route-preserving language switching, localized metadata, and predictable sharing.

## Decision

Use locale-prefixed application routes:

```text
/en/...
/ru/...
```

Configuration:

```text
localePrefix: always
defaultLocale: en
```

Retain the selected locale in a long-lived locale cookie.

Use locale-aware navigation helpers instead of manually concatenating locale prefixes.

Keep technical `/auth/confirm` outside localized application routes and carry the intended locale explicitly.

## Consequences

Positive:

- stable language-specific URLs;
- predictable metadata;
- route-preserving switching;
- explicit locale context.

Costs:

- every application route lives below `[locale]`;
- technical callbacks require careful redirect handling;
- proxy composition is architecture-critical.

## Alternatives considered

### Locale only in user settings

Rejected because URLs would not express language.

### Permanently redirect locale-less routes to English

Rejected because it ignores the user's retained locale.

## Follow-up

- test both locales for every new route;
- test long Russian labels;
- maintain localized metadata and not-found behavior.

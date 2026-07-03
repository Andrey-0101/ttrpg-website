# ADR-006: `next-intl` and Supabase Proxy Composition

- Status: Accepted
- Date: 2026-07-02

## Context

The application requires both locale routing and Supabase session refresh in the same request pipeline. Copying all Supabase middleware headers over the localization response previously broke locale resolution and produced duplicate locale prefixes.

## Decision

The root proxy:

1. executes Supabase session refresh;
2. executes the `next-intl` middleware;
3. copies only Supabase cookies into the localization response;
4. does not overwrite `next-intl` routing headers with Supabase override headers.

## Consequences

Positive:

- authentication cookies refresh;
- locale routing remains authoritative;
- route switching avoids duplicated prefixes.

Costs:

- middleware changes require regression testing;
- generic middleware composition examples may not be safe for this project.

## Alternatives considered

### Copy all headers

Rejected because it broke locale context.

### Separate independent middleware files

Not available as a reliable composition model for the current application.

## Follow-up

After proxy changes, test:

```text
/en
/ru
/en/login
/ru/login
authenticated locale switching
locale-less redirect
/auth/confirm
```

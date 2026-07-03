# ADR-002: Private Character Portrait Storage

- Status: Accepted
- Date: 2026-07-02

## Context

Character portraits must not inflate JSONB/database rows and must follow character ownership.

## Decision

Store portrait bytes in the private Supabase Storage bucket:

```text
character-portraits
```

Store only a path/reference in:

```text
characters.portrait_url
```

New object paths use:

```text
USER_ID/CHARACTER_ID/UNIQUE_FILE_NAME
```

Use owner-folder Storage policies and signed URLs.

Limits:

```text
5 MB
JPEG
PNG
WebP
```

Keep the existing column name for compatibility even though it stores a path for new objects.

## Consequences

Positive:

- private access;
- database rows remain small;
- replacement/removal is possible;
- signed display URLs can expire.

Costs:

- row and object lifecycle are not transactional;
- cleanup may fail;
- orphan objects are possible;
- signed URLs must be refreshed;
- legacy external URLs require compatibility logic.

## Alternatives considered

### Base64 in JSONB

Rejected because of row size and lifecycle problems.

### Public bucket

Rejected because current characters are private.

### Rename column immediately

Deferred to avoid a migration with limited user value.

## Follow-up

- define orphan cleanup before public launch;
- retain old portrait until new upload and row update succeed;
- review focal-point/crop metadata separately;
- update Storage tests when campaign/public sharing is implemented.

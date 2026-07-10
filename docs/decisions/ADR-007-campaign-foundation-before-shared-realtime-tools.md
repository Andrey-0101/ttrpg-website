# ADR-007: Campaign Foundation Before Shared Realtime Tools

- Status: Accepted
- Date: 2026-07-09

## Context

The roadmap includes shared VtM dice rolls and private video rooms. Both require one authoritative set of permitted users before realtime or persisted shared tools are added.

The product owner also approved a deliberately simple role model:

- exactly one Game Master per campaign;
- the campaign creator is the Game Master;
- the Game Master role cannot be transferred;
- all other campaign members are Players.

## Decision

Implement the minimum Campaign Foundation before shared campaign dice history or video access.

The minimum foundation contains:

```text
campaign
single immutable Game Master
Player membership
single-use expiring invitation
character assignment
campaign authorization helpers
RLS and Storage read policies
```

The Game Master is stored directly on the campaign as `game_master_id`.

`campaign_members` contains only Players and therefore does not contain a role column. The Game Master is not duplicated as a membership row.

Direct membership insertion is denied. Player membership is created only through atomic acceptance of a valid, unexpired, unrevoked, unused invitation.

A character remains owned and editable only by its owner. Campaign participants receive read-only access only when the character:

- has `visibility = campaign`;
- has an active campaign assignment;
- belongs to a campaign the viewer can access.

Personal, non-shared dice may be implemented independently. Persisted campaign rolls, realtime feeds, and video-room tokens must use the campaign authorization boundary.

## Consequences

Positive:

- one authorization boundary for future shared tools;
- no competing owner, Game Master, and membership-role sources;
- a second Game Master cannot be created accidentally;
- removing a Player removes future campaign-derived access;
- invitation expiry and revocation are part of the foundation;
- character ownership and campaign visibility remain separate;
- future dice and video features do not invent independent invite systems.

Costs:

- Game Master transfer is unavailable;
- deleting the Game Master's Auth account cascade-deletes the campaign;
- campaign schema, functions, RLS, and Storage read policy require multi-user testing;
- visible dice/video work starts after foundational data work.

## Alternatives considered

### Multiple Game Masters

Rejected for the initial product because it adds role assignment, demotion, ownership conflict, and transfer rules before they are needed.

### Separate owner and Game Master roles

Rejected because the approved product has one Game Master who is also the campaign creator and lifecycle authority.

### Store Game Master in the membership table

Rejected because it would allow multiple Game Master rows unless additional complexity were added and would duplicate the campaign authority source.

### Build dice and video first with ad hoc invite codes

Rejected because both tools would later require migration to campaign membership.

### Fully implement all campaign content first

Rejected because handouts, NPCs, sessions, and notes can follow after the minimum authorization foundation.

## Follow-up

Completed:

1. SQL draft reviewed outside `supabase/migrations`;
2. RLS matrix reviewed;
3. foundation and corrective migrations created;
4. migrations applied to the linked Supabase project;
5. `types/database.types.ts` regenerated;
6. GM/Player/Outsider RLS and Storage behavior tested;
7. Campaign Foundation UI completed;
8. permanent database and campaign documentation synchronized.

Next:

- personal dice may remain outside campaign persistence;
- persisted campaign dice, realtime feeds, and video tokens must reuse the implemented campaign authorization boundary;
- future campaign-owned tables require equivalent multi-user tests.

Accepted ADRs must not be silently reversed. A future decision to support Game Master transfer or multiple Game Masters requires a superseding ADR.

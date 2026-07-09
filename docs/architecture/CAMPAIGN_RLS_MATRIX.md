# Campaign Foundation RLS Matrix

## Status

Reviewed authorization design. The Campaign Foundation migration is not applied.

This matrix describes the intended minimum access boundary for:

```text
campaigns
campaign_members
campaign_invitations
campaign_characters
characters
character-portraits
```

## Actors

| Actor | Meaning |
|---|---|
| Game Master | `campaigns.game_master_id = auth.uid()` |
| Player | A row exists in `campaign_members` for `auth.uid()` |
| Character owner | `characters.owner_id = auth.uid()` |
| Authenticated outsider | Signed-in user with no campaign access |
| Anonymous user | No authenticated user |

A campaign has exactly one immutable Game Master. Membership rows represent only Players.

## Campaigns

| Operation | Game Master | Player | Outsider | Anonymous |
|---|---:|---:|---:|---:|
| Select accessible campaign | Allow | Allow | Deny | Deny |
| Insert campaign | Allow only with self as GM | Allow only as creator/self-GM | N/A | Deny |
| Update active campaign | Allow | Deny | Deny | Deny |
| Change `game_master_id` | Deny | Deny | Deny | Deny |
| Update completed campaign | Deny | Deny | Deny | Deny |
| Delete campaign | Allow | Deny | Deny | Deny |

Additional invariants:

- insert requires `game_master_id = auth.uid()`;
- initial status is `active`;
- Game Master transfer is blocked by trigger;
- completed campaigns cannot be reactivated;
- deleting the Game Master's Auth account cascade-deletes the campaign.

## Campaign members

| Operation | Game Master | Same Player | Other campaign Player | Outsider | Anonymous |
|---|---:|---:|---:|---:|---:|
| Select member list | Allow | Allow | Allow | Deny | Deny |
| Insert membership directly | Deny | Deny | Deny | Deny | Deny |
| Accept valid invitation to an unjoined campaign | Deny | Deny if already joined | Deny if already joined | Allow after authentication | Deny |
| Delete Player membership | Allow | Allow own row | Deny | Deny | Deny |
| Update membership | Deny | Deny | Deny | Deny | Deny |

Additional invariants:

- the Game Master cannot be inserted into `campaign_members`;
- invitation acceptance is the only membership-creation path;
- an existing Player cannot consume another invitation for the same campaign;
- removing a Player ends active assignments for that Player's characters.

## Campaign invitations

| Operation | Game Master | Player | Outsider | Anonymous |
|---|---:|---:|---:|---:|
| List invitation metadata | Allow | Deny | Deny | Deny |
| Create invitation | Allow through function | Deny | Deny | Deny |
| Revoke unused invitation | Allow through function | Deny | Deny | Deny |
| Read `token_hash` through application query | GM policy can select row; UI must not expose hash | Deny | Deny | Deny |
| Accept valid raw token | Deny for the campaign GM | Deny if already joined | Allow after authentication | Deny |
| Reuse accepted token | Deny | Deny | Deny | Deny |
| Use expired/revoked token | Deny | Deny | Deny | Deny |

Invitation rules:

- raw token returned once at creation;
- only hash persisted;
- fixed seven-day lifetime;
- single-use;
- campaign and invitation row locks serialize acceptance, revocation, and campaign completion;
- accepted, expired, revoked, and unknown tokens map to the same safe user-facing failure;
- `created_by` must equal the campaign Game Master.

## Campaign character assignments

| Operation | Game Master | Character-owning Player | Other campaign Player | Outsider | Anonymous |
|---|---:|---:|---:|---:|---:|
| Select campaign assignment list | Allow | Allow | Allow | Deny | Deny |
| Link own eligible character | Allow for own character | Allow | Deny | Deny | Deny |
| Link another user's character | Deny | Deny | Deny | Deny | Deny |
| Unlink own character | Allow for own character | Allow | Deny | Deny | Deny |
| Unlink another Player's character | Allow | Deny | Deny | Deny | Deny |
| Delete assignment history | Deny in first version | Deny | Deny | Deny | Deny |

Eligibility rules:

- character owner equals `auth.uid()`;
- campaign is active;
- actor is campaign Game Master or Player;
- character visibility equals `campaign`;
- character and campaign game systems match;
- character has no other active campaign assignment.

Assignments use `unlinked_at` rather than deleting history.

## Characters

Existing owner policies remain authoritative for insert, update, and delete.

| Operation | Owner | Same campaign GM | Same campaign Player | Removed Player | Outsider | Anonymous |
|---|---:|---:|---:|---:|---:|---:|
| Select private character | Allow | Deny | Deny | Deny | Deny | Deny |
| Select actively linked `campaign` character | Allow | Allow | Allow | Deny | Deny | Deny |
| Update character | Allow | Deny | Deny | Deny | Deny | Deny |
| Delete character | Allow | Deny | Deny | Deny | Deny | Deny |

Campaign-derived read access requires all of:

- `characters.visibility = campaign`;
- character and campaign game systems match;
- active `campaign_characters` assignment;
- character owner is still the campaign Game Master or Player;
- viewer is the campaign Game Master or Player.

Changing visibility away from `campaign` or changing the linked character's game system ends the active assignment.

## Character portraits

Existing owner-folder policies remain unchanged for upload, update, and delete.

| Operation | Owner | Same campaign GM | Same campaign Player | Removed Player | Outsider | Anonymous |
|---|---:|---:|---:|---:|---:|---:|
| Read own portrait | Allow | N/A | N/A | N/A | Deny | Deny |
| Read actively shared campaign portrait | Allow | Allow | Allow | Deny | Deny | Deny |
| Upload portrait | Allow in own folder | Deny | Deny | Deny | Deny | Deny |
| Update/delete portrait | Allow in own folder | Deny | Deny | Deny | Deny | Deny |

The campaign read policy validates the owner ID in the first path segment and the character ID in the second segment:

```text
USER_ID/CHARACTER_ID/UNIQUE_FILE_NAME
```

Both IDs must match the same character row. Malformed or mismatched paths return no campaign access.

## Lifecycle effects

### Player removed or leaves

Immediately:

- membership row is deleted;
- campaign reads are denied;
- active assignments for that Player's characters are marked unlinked;
- campaign-derived character and portrait reads are denied.

### Campaign completed

Immediately:

- campaign becomes read-only;
- unused invitations are revoked;
- active character assignments are marked unlinked;
- campaign-derived character and portrait reads end.

### Game Master account deleted

Through cascade:

- campaign deleted;
- memberships deleted;
- invitations deleted;
- assignments deleted.

Character rows remain controlled by their own owners.

## Required multi-user tests

Use at least three authenticated accounts:

```text
User A: Game Master
User B: Player
User C: outsider
```

Verify:

1. A creates campaign with A as immutable GM.
2. B cannot insert membership directly.
3. A creates one invitation and receives the raw token once.
4. C cannot list invitation metadata.
5. B accepts the invitation.
6. The same token cannot be reused, and B cannot consume another invitation for the same campaign.
7. B can read campaign and member list.
8. C cannot read campaign or member list.
9. B can link only B's own `campaign` character with the same game system as the campaign.
10. A and B can read B's linked character and portrait.
11. A and B cannot update or delete B's character.
12. C cannot read B's linked character or portrait.
13. A portrait path with a mismatched owner segment does not receive campaign read access.
14. Changing the linked character's visibility or game system ends the active assignment.
15. B leaves; B's active assignment ends.
16. B loses campaign-derived access immediately.
17. A cannot change `game_master_id`.
18. A completes the campaign; open invitations are revoked and active assignments end.
19. Completed campaign settings cannot be updated.
20. A can delete the campaign.

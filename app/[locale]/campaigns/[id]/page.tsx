import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import CampaignCharactersPanel from "@/components/campaigns/campaign-characters-panel";
import CampaignInvitationManager from "@/components/campaigns/campaign-invitation-manager";
import CampaignManagementPanel from "@/components/campaigns/campaign-management-panel";
import CampaignMembersPanel from "@/components/campaigns/campaign-members-panel";
import { Link, redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  getGameSystemName,
  normalizeGameSystemId,
} from "@/lib/characters/game-systems";
import { getCharacterPortraitSignedUrl } from "@/lib/characters/portrait";
import { createClient } from "@/utils/supabase/server";

type CampaignPageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

async function getRequestTimestamp() {
  await connection();
  return Date.now();
}

export async function generateMetadata({
  params,
}: CampaignPageProps): Promise<Metadata> {
  const { locale: requestedLocale, id } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const translations = await getTranslations({
    locale,
    namespace: "PageMetadata",
  });
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    return {
      title: translations("campaignDetails"),
    };
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  return {
    title: campaign?.name || translations("campaignDetails"),
  };
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { locale: requestedLocale, id } = await params;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const translations = await getTranslations({
    locale,
    namespace: "CampaignDetails",
  });
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ?? "";

  if (claimsError || !userId) {
    redirect({
      href: "/login",
      locale,
    });
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(
      "id, name, description, game_system, status, game_master_id, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load campaign:", error);
  }

  if (error || !campaign) {
    notFound();
  }

  const isGameMaster = campaign.game_master_id === userId;
  const [membersResult, assignmentsResult, ownCharactersResult] =
    await Promise.all([
      supabase
        .from("campaign_members")
        .select("user_id, joined_at")
        .eq("campaign_id", campaign.id)
        .order("joined_at", {
          ascending: true,
        }),
      supabase
        .from("campaign_characters")
        .select("id, character_id, linked_by, linked_at")
        .eq("campaign_id", campaign.id)
        .is("unlinked_at", null)
        .order("linked_at", {
          ascending: true,
        }),
      supabase
        .from("characters")
        .select("id, name, game_system, visibility, portrait_url")
        .eq("owner_id", userId)
        .eq("game_system", campaign.game_system)
        .order("created_at", {
          ascending: false,
        }),
    ]);

  if (membersResult.error) {
    console.error("Failed to load campaign Players:", membersResult.error);
  }

  if (assignmentsResult.error) {
    console.error(
      "Failed to load campaign character assignments:",
      assignmentsResult.error,
    );
  }

  if (ownCharactersResult.error) {
    console.error(
      "Failed to load owned campaign-compatible characters:",
      ownCharactersResult.error,
    );
  }

  const membershipRows = membersResult.data ?? [];
  const assignmentRows = assignmentsResult.data ?? [];
  const linkedCharacterIds = assignmentRows.map(
    (assignment) => assignment.character_id,
  );
  const linkedCharactersResult =
    linkedCharacterIds.length > 0
      ? await supabase
          .from("characters")
          .select("id, name, owner_id, game_system, visibility, portrait_url")
          .in("id", linkedCharacterIds)
      : {
          data: [],
          error: null,
        };

  if (linkedCharactersResult.error) {
    console.error(
      "Failed to load linked campaign characters:",
      linkedCharactersResult.error,
    );
  }

  const profileIds = Array.from(
    new Set([
      campaign.game_master_id,
      ...membershipRows.map((member) => member.user_id),
      ...(linkedCharactersResult.data ?? []).map(
        (character) => character.owner_id,
      ),
    ]),
  );
  const profilesResult =
    profileIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, username")
          .in("id", profileIds)
      : {
          data: [],
          error: null,
        };

  if (profilesResult.error) {
    console.error(
      "Failed to load campaign participant profiles:",
      profilesResult.error,
    );
  }

  const profileById = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
  );
  const gameMasterProfile = profileById.get(campaign.game_master_id);
  const gameMasterName = isGameMaster
    ? translations("you")
    : gameMasterProfile?.display_name ||
      gameMasterProfile?.username ||
      translations("gameMasterFallback");
  const members = membershipRows.map((member) => {
    const profile = profileById.get(member.user_id);

    return {
      userId: member.user_id,
      displayName: profile?.display_name ?? null,
      username: profile?.username ?? null,
      joinedAt: member.joined_at,
    };
  });

  const linkedCharacterById = new Map(
    (linkedCharactersResult.data ?? []).map((character) => [
      character.id,
      character,
    ]),
  );
  const linkedCharacters = await Promise.all(
    assignmentRows.flatMap((assignment) => {
      const character = linkedCharacterById.get(assignment.character_id);

      if (!character) {
        return [];
      }

      const ownerProfile = profileById.get(character.owner_id);
      const ownerName =
        character.owner_id === userId
          ? translations("you")
          : ownerProfile?.display_name ||
            ownerProfile?.username ||
            translations("characterOwnerFallback");

      return [
        (async () => ({
          assignmentId: assignment.id,
          characterId: character.id,
          name: character.name,
          ownerId: character.owner_id,
          ownerName,
          portraitUrl: await getCharacterPortraitSignedUrl(
            supabase,
            character.portrait_url,
          ),
          linkedAt: assignment.linked_at,
        }))(),
      ];
    }),
  );

  const ownCharacters = ownCharactersResult.data ?? [];
  const ownCharacterIds = ownCharacters.map((character) => character.id);
  const ownActiveAssignmentsResult =
    ownCharacterIds.length > 0
      ? await supabase
          .from("campaign_characters")
          .select("character_id, campaign_id")
          .in("character_id", ownCharacterIds)
          .is("unlinked_at", null)
      : {
          data: [],
          error: null,
        };

  if (ownActiveAssignmentsResult.error) {
    console.error(
      "Failed to check existing character assignments:",
      ownActiveAssignmentsResult.error,
    );
  }

  const activeCampaignByCharacterId = new Map(
    (ownActiveAssignmentsResult.data ?? []).map((assignment) => [
      assignment.character_id,
      assignment.campaign_id,
    ]),
  );
  const linkedToCurrentCampaign = new Set(
    assignmentRows.map((assignment) => assignment.character_id),
  );
  const availableCharacters = await Promise.all(
    ownCharacters
      .filter((character) => !linkedToCurrentCampaign.has(character.id))
      .map(async (character) => ({
        id: character.id,
        name: character.name,
        visibility: character.visibility,
        portraitUrl: await getCharacterPortraitSignedUrl(
          supabase,
          character.portrait_url,
        ),
        linkedElsewhere:
          activeCampaignByCharacterId.has(character.id) &&
          activeCampaignByCharacterId.get(character.id) !== campaign.id,
      })),
  );

  let invitationLoadError = false;
  let invitations: {
    id: string;
    createdAt: string;
    expiresAt: string;
    acceptedAt: string | null;
    revokedAt: string | null;
  }[] = [];

  if (isGameMaster) {
    const invitationsResult = await supabase
      .from("campaign_invitations")
      .select("id, created_at, expires_at, accepted_at, revoked_at")
      .eq("campaign_id", campaign.id)
      .order("created_at", {
        ascending: false,
      });

    if (invitationsResult.error) {
      invitationLoadError = true;
      console.error(
        "Failed to load campaign invitations:",
        invitationsResult.error,
      );
    } else {
      invitations = (invitationsResult.data ?? []).map((invitation) => ({
        id: invitation.id,
        createdAt: invitation.created_at,
        expiresAt: invitation.expires_at,
        acceptedAt: invitation.accepted_at,
        revokedAt: invitation.revoked_at,
      }));
    }
  }

  const normalizedGameSystemId = normalizeGameSystemId(campaign.game_system);
  const createCharacterHref = normalizedGameSystemId
    ? `/characters/new/${normalizedGameSystemId}`
    : "/characters/new";
  const characterLoadError = Boolean(
    assignmentsResult.error ||
    linkedCharactersResult.error ||
    ownCharactersResult.error ||
    ownActiveAssignmentsResult.error ||
    profilesResult.error,
  );

  const statusLabel =
    campaign.status === "completed"
      ? translations("status.completed")
      : translations("status.active");
  const roleLabel = isGameMaster
    ? translations("role.gameMaster")
    : translations("role.player");
  const createdDate = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(campaign.created_at));
  const currentTimestamp = await getRequestTimestamp();

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-3 py-6 sm:px-6 lg:p-8">
      <Link href="/campaigns">
        <span aria-hidden="true">&larr;</span> {translations("back")}
      </Link>

      <section className="mt-6 overflow-hidden rounded-lg border border-neutral-300 bg-white text-neutral-950 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-neutral-300 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-bold sm:text-4xl">
              {campaign.name}
            </h1>
            <p className="mt-3 max-w-3xl whitespace-pre-wrap break-words text-neutral-700">
              {campaign.description?.trim() || translations("noDescription")}
            </p>
          </div>

          <span
            className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              campaign.status === "completed"
                ? "bg-neutral-200 text-neutral-700"
                : "bg-emerald-100 text-emerald-900"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <dl className="grid gap-px bg-neutral-300 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0 bg-neutral-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {translations("gameSystem")}
            </dt>
            <dd className="mt-1 break-words font-medium">
              {getGameSystemName(campaign.game_system)}
            </dd>
          </div>

          <div className="min-w-0 bg-neutral-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {translations("yourRole")}
            </dt>
            <dd className="mt-1 break-words font-medium">{roleLabel}</dd>
          </div>

          <div className="min-w-0 bg-neutral-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {translations("gameMaster")}
            </dt>
            <dd className="mt-1 break-words font-medium">{gameMasterName}</dd>
          </div>

          <div className="min-w-0 bg-neutral-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {translations("created")}
            </dt>
            <dd className="mt-1 break-words font-medium">{createdDate}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="rounded-lg border border-white/25 bg-black/20 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/65">
            {translations("players")}
          </p>
          <p className="mt-2 text-4xl font-bold">{members.length}</p>
          <p className="mt-2 text-sm text-white/75">
            {translations("playersHelp")}
          </p>
        </article>

        <article className="rounded-lg border border-white/25 bg-black/20 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/65">
            {translations("linkedCharacters")}
          </p>
          <p className="mt-2 text-4xl font-bold">{linkedCharacters.length}</p>
          <p className="mt-2 text-sm text-white/75">
            {translations("linkedCharactersHelp")}
          </p>
        </article>
      </section>

      <div className="mt-6 grid gap-6">
        {isGameMaster && (
          <CampaignManagementPanel
            campaignId={campaign.id}
            initialName={campaign.name}
            initialDescription={campaign.description}
            initialStatus={campaign.status}
          />
        )}

        {isGameMaster && (
          <CampaignInvitationManager
            campaignId={campaign.id}
            locale={locale}
            campaignStatus={campaign.status}
            currentTimestamp={currentTimestamp}
            initialInvitations={invitations}
            loadError={invitationLoadError}
          />
        )}

        <CampaignMembersPanel
          campaignId={campaign.id}
          campaignStatus={campaign.status}
          currentUserId={userId}
          gameMasterName={gameMasterName}
          isGameMaster={isGameMaster}
          locale={locale}
          initialMembers={members}
          loadError={Boolean(membersResult.error)}
        />

        <CampaignCharactersPanel
          campaignId={campaign.id}
          campaignStatus={campaign.status}
          currentUserId={userId}
          isGameMaster={isGameMaster}
          createCharacterHref={createCharacterHref}
          initialLinkedCharacters={linkedCharacters}
          availableCharacters={availableCharacters}
          loadError={characterLoadError}
        />
      </div>
    </main>
  );
}

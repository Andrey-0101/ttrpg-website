"use client";

import { useMemo, useRef, useState } from "react";

import { useTranslations } from "next-intl";
import { useCampaignGameMasterRole } from "@/lib/game-systems/use-campaign-role";

import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";
import type { CampaignRosterMember } from "@/lib/campaigns/roster.server";

type CampaignMembersPanelProps = {
  gameSystem: string;
  campaignId: string;
  campaignStatus: string;
  currentUserId: string;
  gameMasterName: string;
  isGameMaster: boolean;
  locale: string;
  initialMembers: CampaignRosterMember[];
  characterNamesByUserId: ReadonlyMap<string, string>;
  loadError: boolean;
};

export default function CampaignMembersPanel({
  gameSystem,
  campaignId,
  campaignStatus,
  currentUserId,
  gameMasterName,
  isGameMaster,
  locale,
  initialMembers,
  characterNamesByUserId,
  loadError,
}: CampaignMembersPanelProps) {
  const translations = useTranslations("CampaignMembers");
  const role = useCampaignGameMasterRole(gameSystem);
  const router = useRouter();
  const [removedMemberships, setRemovedMemberships] = useState<string[]>([]);
  const membershipKey = (member: CampaignRosterMember) => `${campaignId}:${member.userId}:${member.joinedAt}`;
  const members = initialMembers.filter((member) => !removedMemberships.includes(membershipKey(member)));
  const [mutatingUserId, setMutatingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const mutationLockRef = useRef(false);
  const isActiveCampaign = campaignStatus === "active";
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
      }),
    [locale],
  );

  async function handleRemoveMember(member: CampaignRosterMember) {
    if (mutationLockRef.current || !isActiveCampaign) {
      return;
    }

    const isLeaving = member.userId === currentUserId;
    const confirmed = window.confirm(
      isLeaving
        ? translations("leaveConfirm")
        : translations("removeConfirm", {
            name: member.label,
          }),
    );

    if (!confirmed) {
      return;
    }

    mutationLockRef.current = true;
    setMutatingUserId(member.userId);
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("campaign_members")
        .delete()
        .eq("campaign_id", campaignId)
        .eq("user_id", member.userId);

      if (error) {
        throw error;
      }

      if (isLeaving) {
        router.replace("/campaigns");
        router.refresh();
        return;
      }

      setRemovedMemberships((current) => [...current, membershipKey(member)]);
      router.refresh();
    } catch (error) {
      console.error("Failed to remove campaign Player:", error);
      setErrorMessage(
        isLeaving ? translations("leaveError") : translations("removeError"),
      );
    } finally {
      mutationLockRef.current = false;
      setMutatingUserId(null);
    }
  }

  return (
    <section className="rounded-lg border border-white/25 bg-black/20 p-5 sm:p-6">
      <h2 className="text-2xl font-bold">{translations("title")}</h2>
      <p className="mt-2 max-w-3xl text-sm text-white/80 sm:text-base">
        {translations("description", role)}
      </p>

      {loadError && (
        <div
          className="mt-5 rounded border border-red-300 bg-red-50 p-4 text-red-950"
          role="alert"
        >
          <p>{translations("loadError")}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-3 rounded border border-red-500 px-3 py-2 text-sm font-semibold"
          >
            {translations("retry")}
          </button>
        </div>
      )}

      <ul className="mt-5 grid grid-cols-1 gap-3">
        <li className="rounded-lg border border-white/20 bg-black/20 p-4">
          <div className="flex flex-col gap-1">
            <p className="break-words font-semibold">{gameMasterName}</p>
            <p className="text-sm text-white/70">
              {role.role}
            </p>
            <p className="text-xs text-white/55">
              {translations("permanentGameMaster")}
            </p>
          </div>
        </li>

        {members.map((member) => {
          const isCurrentPlayer = member.userId === currentUserId;
          const canRemove =
            isActiveCampaign && (isGameMaster || isCurrentPlayer);
          const isMutating = mutatingUserId === member.userId;

          return (
            <li
              key={member.userId}
              className="rounded-lg border border-white/20 bg-black/20 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-all font-semibold">
                    {member.label}
                  </p>
                  <p className="mt-1 wrap-anywhere text-sm text-white/70">
                    {characterNamesByUserId.get(member.userId) || translations("playerRole")}
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    {translations("joined", {
                      date: dateFormatter.format(new Date(member.joinedAt)),
                    })}
                  </p>
                </div>

                {canRemove && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member)}
                    disabled={mutatingUserId !== null}
                    aria-label={isCurrentPlayer ? translations("leave") : translations("removeNamed", { name: member.label })}
                    className={`w-full shrink-0 rounded border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
                      isCurrentPlayer
                        ? "border-amber-300 text-amber-100 hover:bg-amber-950/30"
                        : "border-red-300 text-red-100 hover:bg-red-950/30"
                    }`}
                  >
                    {isMutating
                      ? isCurrentPlayer
                        ? translations("leaving")
                        : translations("removing")
                      : isCurrentPlayer
                        ? translations("leave")
                        : translations("remove")}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {members.length === 0 && (
        <p className="mt-4 text-sm text-white/70">
          {translations("noPlayers")}
        </p>
      )}

      {!isActiveCampaign && (
        <p className="mt-4 text-sm text-white/70">
          {translations("completedHelp")}
        </p>
      )}

      {errorMessage && (
        <p className="mt-4 text-sm font-medium text-red-200" role="alert">
          {errorMessage}
        </p>
      )}
    </section>
  );
}

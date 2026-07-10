"use client";

import { useMemo, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";

type CampaignMember = {
  userId: string;
  displayName: string | null;
  username: string | null;
  joinedAt: string;
};

type CampaignMembersPanelProps = {
  campaignId: string;
  campaignStatus: string;
  currentUserId: string;
  gameMasterName: string;
  isGameMaster: boolean;
  locale: string;
  initialMembers: CampaignMember[];
  loadError: boolean;
};

export default function CampaignMembersPanel({
  campaignId,
  campaignStatus,
  currentUserId,
  gameMasterName,
  isGameMaster,
  locale,
  initialMembers,
  loadError,
}: CampaignMembersPanelProps) {
  const translations = useTranslations("CampaignMembers");
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
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

  function getMemberName(member: CampaignMember) {
    if (member.userId === currentUserId) {
      return translations("you");
    }

    return (
      member.displayName ||
      member.username ||
      translations("playerFallback")
    );
  }

  async function handleRemoveMember(member: CampaignMember) {
    if (mutationLockRef.current || !isActiveCampaign) {
      return;
    }

    const isLeaving = member.userId === currentUserId;
    const memberName = getMemberName(member);
    const confirmed = window.confirm(
      isLeaving
        ? translations("leaveConfirm")
        : translations("removeConfirm", {
            name: memberName,
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

      setMembers((current) =>
        current.filter((item) => item.userId !== member.userId),
      );
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
        {translations("description")}
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

      <ul className="mt-5 grid gap-3">
        <li className="rounded-lg border border-white/20 bg-black/20 p-4">
          <div className="flex flex-col gap-1">
            <p className="break-words font-semibold">{gameMasterName}</p>
            <p className="text-sm text-white/70">
              {translations("gameMasterRole")}
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
                  <p className="break-words font-semibold">
                    {getMemberName(member)}
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    {translations("playerRole")}
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

"use client";

import { useMemo, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";

type CampaignInvitation = {
  id: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
};

type CampaignInvitationManagerProps = {
  campaignId: string;
  locale: string;
  campaignStatus: string;
  currentTimestamp: number;
  initialInvitations: CampaignInvitation[];
  loadError: boolean;
};

type MutationMessage = {
  kind: "status" | "error";
  text: string;
} | null;

type InvitationStatus = "active" | "accepted" | "revoked" | "expired";

function getInvitationStatus(
  invitation: CampaignInvitation,
  now: number,
): InvitationStatus {
  if (invitation.acceptedAt) {
    return "accepted";
  }

  if (invitation.revokedAt) {
    return "revoked";
  }

  if (new Date(invitation.expiresAt).getTime() <= now) {
    return "expired";
  }

  return "active";
}

export default function CampaignInvitationManager({
  campaignId,
  locale,
  campaignStatus,
  currentTimestamp,
  initialInvitations,
  loadError,
}: CampaignInvitationManagerProps) {
  const translations = useTranslations("CampaignInvitations");
  const router = useRouter();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [latestInvitationId, setLatestInvitationId] = useState<string | null>(
    null,
  );
  const [latestInvitationLink, setLatestInvitationLink] = useState("");
  const [message, setMessage] = useState<MutationMessage>(null);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const createLockRef = useRef(false);
  const revokeLockRef = useRef(false);
  const isActiveCampaign = campaignStatus === "active";
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  );

  async function handleCreateInvitation() {
    if (createLockRef.current || !isActiveCampaign) {
      return;
    }

    createLockRef.current = true;
    setCreating(true);
    setMessage({
      kind: "status",
      text: translations("creatingStatus"),
    });

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc("create_campaign_invitation", {
          target_campaign_id: campaignId,
        })
        .single();

      if (error || !data) {
        throw error ?? new Error("Invitation creation returned no data.");
      }

      const invitation: CampaignInvitation = {
        id: data.invitation_id,
        createdAt: new Date().toISOString(),
        expiresAt: data.expires_at,
        acceptedAt: null,
        revokedAt: null,
      };
      const joinPath = `/${locale}/campaigns/join/${encodeURIComponent(
        data.token,
      )}`;
      const invitationLink = new URL(joinPath, window.location.origin).toString();

      setInvitations((current) => [invitation, ...current]);
      setLatestInvitationId(invitation.id);
      setLatestInvitationLink(invitationLink);
      setMessage({
        kind: "status",
        text: translations("createdStatus"),
      });
    } catch (error) {
      console.error("Failed to create campaign invitation:", error);
      setMessage({
        kind: "error",
        text: translations("createError"),
      });
    } finally {
      createLockRef.current = false;
      setCreating(false);
    }
  }

  async function handleCopyInvitation() {
    if (!latestInvitationLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(latestInvitationLink);
      setMessage({
        kind: "status",
        text: translations("copied"),
      });
    } catch (error) {
      console.error("Failed to copy campaign invitation:", error);
      setMessage({
        kind: "error",
        text: translations("copyError"),
      });
    }
  }

  async function handleRevokeInvitation(invitationId: string) {
    if (
      revokeLockRef.current ||
      !isActiveCampaign ||
      !window.confirm(translations("revokeConfirm"))
    ) {
      return;
    }

    revokeLockRef.current = true;
    setRevokingId(invitationId);
    setMessage({
      kind: "status",
      text: translations("revokingStatus"),
    });

    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("revoke_campaign_invitation", {
        target_invitation_id: invitationId,
      });

      if (error) {
        throw error;
      }

      const revokedAt = new Date().toISOString();

      setInvitations((current) =>
        current.map((invitation) =>
          invitation.id === invitationId
            ? {
                ...invitation,
                revokedAt,
              }
            : invitation,
        ),
      );

      if (latestInvitationId === invitationId) {
        setLatestInvitationId(null);
        setLatestInvitationLink("");
      }

      setMessage({
        kind: "status",
        text: translations("revokedStatus"),
      });
    } catch (error) {
      console.error("Failed to revoke campaign invitation:", error);
      setMessage({
        kind: "error",
        text: translations("revokeError"),
      });
    } finally {
      revokeLockRef.current = false;
      setRevokingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-white/25 bg-black/20 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold">{translations("title")}</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/80 sm:text-base">
            {isActiveCampaign
              ? translations("description")
              : translations("completedDescription")}
          </p>
        </div>

        {isActiveCampaign && (
          <button
            type="button"
            onClick={handleCreateInvitation}
            disabled={creating || revokingId !== null}
            className="w-full shrink-0 rounded bg-white px-4 py-2.5 font-medium text-black disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {creating ? translations("creating") : translations("create")}
          </button>
        )}
      </div>

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

      {latestInvitationLink && (
        <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <h3 className="font-semibold">{translations("latestTitle")}</h3>
          <p className="mt-1 text-sm">{translations("latestDescription")}</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              value={latestInvitationLink}
              readOnly
              aria-label={translations("linkLabel")}
              className="min-w-0 flex-1 rounded border border-amber-400 bg-white px-3 py-2 font-mono text-xs text-neutral-950"
            />
            <button
              type="button"
              onClick={handleCopyInvitation}
              className="rounded bg-neutral-950 px-4 py-2 font-medium text-white"
            >
              {translations("copy")}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          className={`mt-4 text-sm font-medium ${
            message.kind === "error" ? "text-red-200" : "text-white/85"
          }`}
          role={message.kind === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      )}

      {invitations.length === 0 ? (
        <p className="mt-5 rounded border border-dashed border-white/30 p-4 text-sm text-white/75">
          {translations("empty")}
        </p>
      ) : (
        <ul className="mt-5 grid gap-3">
          {invitations.map((invitation) => {
            const status = getInvitationStatus(invitation, currentTimestamp);
            const canRevoke = isActiveCampaign && status === "active";
            const isRevoking = revokingId === invitation.id;

            return (
              <li
                key={invitation.id}
                className="rounded-lg border border-white/20 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {translations("statusLabel", {
                        status: translations(`status.${status}`),
                      })}
                    </p>
                    <dl className="mt-2 grid gap-1 text-sm text-white/75">
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="font-medium text-white/90">
                          {translations("created")}:
                        </dt>
                        <dd>{dateFormatter.format(new Date(invitation.createdAt))}</dd>
                      </div>
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="font-medium text-white/90">
                          {translations("expires")}:
                        </dt>
                        <dd>{dateFormatter.format(new Date(invitation.expiresAt))}</dd>
                      </div>
                    </dl>
                    {status === "active" &&
                      latestInvitationId !== invitation.id && (
                        <p className="mt-2 text-xs text-white/60">
                          {translations("linkUnavailable")}
                        </p>
                      )}
                  </div>

                  {canRevoke && (
                    <button
                      type="button"
                      onClick={() => handleRevokeInvitation(invitation.id)}
                      disabled={creating || revokingId !== null}
                      className="w-full shrink-0 rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-100 hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isRevoking
                        ? translations("revoking")
                        : translations("revoke")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

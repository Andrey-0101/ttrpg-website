"use client";

import { useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/utils/supabase/client";

type CampaignInvitationJoinerProps = {
  token: string;
};

type MutationMessage = {
  kind: "status" | "error";
  text: string;
} | null;

export default function CampaignInvitationJoiner({
  token,
}: CampaignInvitationJoinerProps) {
  const translations = useTranslations("CampaignJoin");
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState<MutationMessage>(null);
  const joinLockRef = useRef(false);

  async function handleJoin() {
    if (joinLockRef.current) {
      return;
    }

    joinLockRef.current = true;
    setJoining(true);
    setMessage({
      kind: "status",
      text: translations("joiningStatus"),
    });

    try {
      const supabase = createClient();
      const { data: campaignId, error } = await supabase.rpc(
        "accept_campaign_invitation",
        {
          raw_token: token,
        },
      );

      if (error || typeof campaignId !== "string") {
        throw error ?? new Error("Invitation acceptance returned no campaign.");
      }

      setMessage({
        kind: "status",
        text: translations("joinedStatus"),
      });
      router.replace(`/campaigns/${campaignId}`);
      router.refresh();
    } catch (error) {
      console.error("Failed to accept campaign invitation:", error);
      setMessage({
        kind: "error",
        text: translations("joinError"),
      });
      joinLockRef.current = false;
      setJoining(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-neutral-300 bg-white p-5 text-neutral-950 shadow-sm sm:p-7">
      <h1 className="text-3xl font-bold sm:text-4xl">
        {translations("title")}
      </h1>
      <p className="mt-3 max-w-2xl text-neutral-700">
        {translations("description")}
      </p>
      <p className="mt-3 max-w-2xl text-sm text-neutral-600">
        {translations("securityNote")}
      </p>

      {message && (
        <p
          className={`mt-5 text-sm font-medium ${
            message.kind === "error" ? "text-red-700" : "text-neutral-700"
          }`}
          role={message.kind === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <Link
          href="/campaigns"
          className="rounded border border-neutral-500 px-5 py-3 text-center font-medium"
        >
          {translations("cancel")}
        </Link>
        <button
          type="button"
          onClick={handleJoin}
          disabled={joining}
          className="rounded bg-neutral-950 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {joining ? translations("joining") : translations("join")}
        </button>
      </div>
    </section>
  );
}

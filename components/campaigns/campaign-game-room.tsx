"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import CampaignVideoRoom from "@/components/campaigns/campaign-video-room";
import type { CampaignGameRoomGalleryItem } from "@/components/campaigns/campaign-game-room-workspace";
import type { CampaignVideoParticipantDirectoryEntry } from "@/lib/campaign-video/browser/contracts";
import { mapJournalRow } from "@/lib/campaign-dice/contracts";
import {
  GAME_SESSION_PRESENCE_RENEWAL_MS,
  GAME_SESSION_STATE_REFRESH_MS,
  type GameSessionAction,
  type GameSessionApiResult,
  type GameSessionState,
} from "@/lib/game-sessions/contracts";
import type { Database } from "@/types/database.types";
import { createClient } from "@/utils/supabase/client";

const EMPTY_STATE: GameSessionState = { session: null, journal: [] };

function mergeJournalEvents(
  ...journals: GameSessionState["journal"][]
): GameSessionState["journal"] {
  const byId = new Map(
    journals.flat().map((event) => [event.id, event] as const),
  );
  return [...byId.values()].sort(
    (left, right) =>
      left.createdAt.localeCompare(right.createdAt) ||
      left.id.localeCompare(right.id),
  );
}

export default function CampaignGameRoom({
  campaignId,
  campaignGameSystem,
  campaignStatus,
  directoryReady,
  isGameMaster,
  galleryItems,
  participantDirectory,
}: {
  campaignId: string;
  campaignGameSystem: string;
  campaignStatus: string;
  directoryReady: boolean;
  isGameMaster: boolean;
  galleryItems: CampaignGameRoomGalleryItem[];
  participantDirectory: CampaignVideoParticipantDirectoryEntry[];
}) {
  const [gameSession, setGameSession] = useState<GameSessionState>(EMPTY_STATE);
  const [sessionLoading, setSessionLoading] = useState(
    campaignStatus === "active",
  );
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const requestGeneration = useRef(0);
  const mutationInFlight = useRef(false);
  const [supabase] = useState(createClient);

  const appendJournalEvent = useCallback(
    (event: GameSessionState["journal"][number]) => {
      setGameSession((current) => {
        if (!current.session) return current;
        return {
          session: current.session,
          journal: mergeJournalEvents(current.journal, [event]),
        };
      });
    },
    [],
  );

  const applyResult = useCallback((result: GameSessionApiResult) => {
    if (!result.ok) {
      setSessionError(true);
      return false;
    }
    setGameSession((current) => ({
      session: result.session,
      journal:
        result.session?.id === current.session?.id
          ? mergeJournalEvents(current.journal, result.journal)
          : result.journal,
    }));
    setSessionError(false);
    return true;
  }, []);

  const refresh = useCallback(async () => {
    if (mutationInFlight.current) return;
    const generation = ++requestGeneration.current;
    try {
      const response = await fetch(
        `/api/campaigns/${encodeURIComponent(campaignId)}/game-session`,
        { cache: "no-store" },
      );
      const result = (await response.json()) as GameSessionApiResult;
      if (generation === requestGeneration.current) applyResult(result);
    } catch {
      if (generation === requestGeneration.current) setSessionError(true);
    } finally {
      if (generation === requestGeneration.current) setSessionLoading(false);
    }
  }, [applyResult, campaignId]);

  const mutate = useCallback(
    async (action: GameSessionAction, background = false) => {
      if (mutationInFlight.current) return;
      mutationInFlight.current = true;
      if (!background) setSessionBusy(true);
      const generation = ++requestGeneration.current;
      try {
        const response = await fetch(
          `/api/campaigns/${encodeURIComponent(campaignId)}/game-session`,
          {
            method: "POST",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          },
        );
        const result = (await response.json()) as GameSessionApiResult;
        if (generation === requestGeneration.current) applyResult(result);
      } catch {
        if (generation === requestGeneration.current) setSessionError(true);
      } finally {
        mutationInFlight.current = false;
        if (generation === requestGeneration.current) {
          setSessionLoading(false);
          if (!background) setSessionBusy(false);
        }
      }
    },
    [applyResult, campaignId],
  );

  useEffect(() => {
    if (campaignStatus !== "active") {
      return;
    }

    const initialTimer = window.setTimeout(() => {
      if (isGameMaster) {
        void mutate("renew", true);
      } else {
        void refresh();
      }
    }, 0);
    const refreshTimer = window.setInterval(
      () => void refresh(),
      GAME_SESSION_STATE_REFRESH_MS,
    );
    const renewalTimer = isGameMaster
      ? window.setInterval(
          () => void mutate("renew", true),
          GAME_SESSION_PRESENCE_RENEWAL_MS,
        )
      : null;

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(refreshTimer);
      if (renewalTimer !== null) window.clearInterval(renewalTimer);
    };
  }, [campaignStatus, isGameMaster, mutate, refresh]);

  useEffect(() => {
    if (campaignStatus !== "active") return;

    const refreshSessionState = () => void refresh();
    const channel = supabase
      .channel(`game-session-state-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_sessions",
          filter: `campaign_id=eq.${campaignId}`,
        },
        refreshSessionState,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `campaign_id=eq.${campaignId}`,
        },
        refreshSessionState,
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void refresh();
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [campaignId, campaignStatus, refresh, supabase]);

  useEffect(() => {
    const sessionId = gameSession.session?.id;
    if (!sessionId) return;

    const channel = supabase
      .channel(`game-session-journal-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_session_journal_events",
          filter: `game_session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as Database["public"]["Tables"]["game_session_journal_events"]["Row"];
          appendJournalEvent(mapJournalRow(row));
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void refresh();
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [appendJournalEvent, gameSession.session?.id, refresh, supabase]);

  return (
    <CampaignVideoRoom
      campaignId={campaignId}
      campaignGameSystem={campaignGameSystem}
      campaignStatus={campaignStatus}
      directoryReady={directoryReady}
      isGameMaster={isGameMaster}
      galleryItems={galleryItems}
      participantDirectory={participantDirectory}
      gameSession={gameSession}
      sessionLoading={sessionLoading}
      sessionBusy={sessionBusy}
      sessionError={sessionError}
      onStartSession={() => mutate("start")}
      onEndSession={() => mutate("end")}
      onJournalEvent={appendJournalEvent}
    />
  );
}

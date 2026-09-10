"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import CampaignVideoRoom from "@/components/campaigns/campaign-video-room";
import type { CampaignGameRoomGalleryItem } from "@/components/campaigns/campaign-game-room-workspace";
import type { CampaignVideoParticipantDirectoryEntry } from "@/lib/campaign-video/browser/contracts";
import {
  GAME_SESSION_PRESENCE_RENEWAL_MS,
  GAME_SESSION_STATE_REFRESH_MS,
  type GameSessionAction,
  type GameSessionApiResult,
  type GameSessionState,
} from "@/lib/game-sessions/contracts";

const EMPTY_STATE: GameSessionState = { session: null, journal: [] };

export default function CampaignGameRoom({
  campaignId,
  campaignStatus,
  directoryReady,
  isGameMaster,
  galleryItems,
  participantDirectory,
}: {
  campaignId: string;
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

  const applyResult = useCallback((result: GameSessionApiResult) => {
    if (!result.ok) {
      setSessionError(true);
      return false;
    }
    setGameSession({ session: result.session, journal: result.journal });
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

  return (
    <CampaignVideoRoom
      campaignId={campaignId}
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
    />
  );
}

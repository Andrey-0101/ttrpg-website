"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { GameRoomCharacterRow, OpenGameRoomCharacter } from "@/lib/campaign-characters/contracts";

export default function GameRoomCharactersList({ campaignId, onOpen }: {
  campaignId: string; onOpen(character: OpenGameRoomCharacter): void;
}) {
  const translations = useTranslations("CampaignGameRoom.characters");
  const campaignTranslations = useTranslations("CampaignDetails");
  const [rows, setRows] = useState<GameRoomCharacterRow[] | null>(null);
  const [error, setError] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    requestRef.current = controller;
    void (async () => {
      try {
        const response = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/characters`, { cache: "no-store", signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error("Character list unavailable");
        if (!controller.signal.aborted) setRows(result.rows);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    })();
    return () => { requestRef.current?.abort(); controller.abort(); };
  }, [campaignId]);

  async function open(row: GameRoomCharacterRow) {
    if (!row.canOpen || opening) return;
    setOpening(row.playerId);
    setError(false);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(row.playerId)}`, { cache: "no-store", signal: controller.signal });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error("Character unavailable");
      if (!controller.signal.aborted) onOpen(result);
    } catch {
      if (!controller.signal.aborted) setError(true);
    } finally {
      if (!controller.signal.aborted) setOpening(null);
    }
  }

  return (
    <div className="min-h-0 w-full overflow-y-auto p-3 text-white" data-game-room-characters-list>
      {!rows && !error ? <p role="status">{translations("loading")}</p> : null}
      {rows ? <ul className="space-y-2">{rows.map((row) => {
        const content = <><span className="min-w-0 break-words">{row.playerName || campaignTranslations("playerFallback")}</span><span aria-hidden="true"> — </span><span className="min-w-0 break-words">{row.characterName ?? translations("noCharacter")}</span></>;
        return <li key={row.playerId}>{row.canOpen ? <button type="button" disabled={opening !== null} onClick={() => void open(row)} className="w-full rounded border border-white/25 p-3 text-left hover:bg-white/10 focus-visible:outline focus-visible:outline-2 disabled:opacity-60">{content}</button> : <div className="rounded border border-white/15 p-3 text-white/75">{content}</div>}</li>;
      })}</ul> : null}
      {error ? <p role="alert" className="mt-3 text-rose-200">{translations("unavailable")}</p> : null}
    </div>
  );
}

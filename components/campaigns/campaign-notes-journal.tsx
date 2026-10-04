"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  browserTimezone,
  filterNotes,
  formatNoteTime,
  NOTE_BODY_LIMIT,
  sessionSubtitle,
  sortNotes,
  type NotesFilter,
  type NotesResult,
  type NotesState,
} from "@/lib/campaign-notes/contracts";

const BUTTON =
  "min-h-11 rounded border border-amber-200/60 px-3 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:opacity-45";
const INPUT =
  "w-full min-w-0 rounded border border-white/40 bg-neutral-950 p-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200";
type Editor = { kind: "create" } | { kind: "edit"; id: string };

export default function CampaignNotesJournal({
  campaignId,
}: {
  campaignId: string;
}) {
  const t = useTranslations("CampaignNotes");
  const locale = useLocale();
  const [state, setState] = useState<NotesState>({
    entries: [],
    canWrite: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [body, setBody] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const scroll = useRef<HTMLDivElement>(null);
  const [scrollVersion, setScrollVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<NotesFilter>("all");
  const endpoint = `/api/campaigns/${encodeURIComponent(campaignId)}/notes`;

  useEffect(() => {
    const controller = new AbortController();
    void fetch(endpoint, { cache: "no-store", signal: controller.signal })
      .then((response) => response.json() as Promise<NotesResult>)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.ok) {
          setState(result);
          setScrollVersion((value) => value + 1);
        } else setError("loadError");
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("loadError");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [endpoint]);
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [scrollVersion]);

  async function save(action: "create" | "edit" | "delete", id?: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(id ? { id } : {}),
          ...(action === "delete" ? {} : { body, timezone: browserTimezone() }),
        }),
      });
      const result = (await response.json()) as NotesResult;
      if (!result.ok) {
        if (result.error === "campaign_notes_read_only")
          setState((current) => ({ ...current, canWrite: false }));
        setError(action === "delete" ? "deleteError" : "saveError");
        return;
      }
      setState(result);
      setEditor(null);
      setDeleting(null);
      setBody("");
      if (action === "create") {
        setQuery("");
        setScrollVersion((value) => value + 1);
      }
    } catch {
      setError(action === "delete" ? "deleteError" : "saveError");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  const visible = filterNotes(
    sortNotes(state.entries),
    query,
    filter,
    locale,
    t("session"),
  );
  const validBody = Boolean(body.trim()) && body.length <= NOTE_BODY_LIMIT;
  const textarea = (label: string) => (
    <label className="block">
      <span className="sr-only">{label}</span>
      <textarea
        autoFocus
        rows={6}
        maxLength={NOTE_BODY_LIMIT}
        value={body}
        disabled={busy}
        onChange={(event) => setBody(event.target.value)}
        className={`${INPUT} resize-y text-sm leading-6`}
      />
      <span className="mt-1 block text-xs text-white/65">
        {t("bodyHelp", { max: NOTE_BODY_LIMIT })}
      </span>
    </label>
  );

  return (
    <section
      className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden text-white"
      data-campaign-notes
    >
      <div className="shrink-0 space-y-2 p-3">
        <h2 className="font-bold">{t("title")}</h2>
        <div className="flex min-w-0 gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{t("search")}</span>
            <input
              type="search"
              value={query}
              disabled={Boolean(editor)}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search")}
              className={INPUT}
            />
          </label>
          <label className="min-w-0">
            <span className="sr-only">{t("filter")}</span>
            <select
              value={filter}
              disabled={Boolean(editor)}
              onChange={(event) => setFilter(event.target.value as NotesFilter)}
              className={INPUT}
            >
              {(["all", "text", "date", "session"] as const).map((item) => (
                <option key={item} value={item}>
                  {t(item)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!loading && !state.canWrite ? (
          <p className="text-sm text-white/70">{t("readOnly")}</p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-rose-200">
            {t(error)}
          </p>
        ) : null}
      </div>
      <div
        ref={scroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pt-0"
        data-campaign-notes-scroll
      >
        {loading ? (
          <p role="status">{t("loading")}</p>
        ) : (
          <>
            {visible.length === 0 ? (
              <p role="status" className="py-4 text-sm text-white/70">
                {query ? t("noMatches") : t("empty")}
              </p>
            ) : null}
            <ol className="space-y-6">
              {visible.map((entry) => (
                <li
                  key={entry.id}
                  className="min-w-0 border-b border-white/20 pb-4"
                  data-note-entry={entry.id}
                >
                  <h3 className="break-words text-sm font-bold [overflow-wrap:anywhere]">
                    {entry.campaign_name_snapshot},{" "}
                    {formatNoteTime(
                      entry.created_at,
                      entry.created_timezone,
                      locale,
                    )}
                    {entry.edited_at && entry.edited_timezone
                      ? `. ${t("editMarker")} ${formatNoteTime(entry.edited_at, entry.edited_timezone, locale)}`
                      : ""}
                  </h3>
                  {entry.game_sessions ? (
                    <p className="mt-1 break-words text-sm italic [overflow-wrap:anywhere]">
                      {sessionSubtitle(entry.game_sessions, t("session"))}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    {editor?.kind === "edit" && editor.id === entry.id ? (
                      <>
                        {textarea(t("edit"))}
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            disabled={busy || !validBody || !state.canWrite}
                            onClick={() => void save("edit", entry.id)}
                            className={BUTTON}
                          >
                            {t("save")}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setEditor(null);
                              setBody("");
                            }}
                            className={BUTTON}
                          >
                            {t("cancel")}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-6 text-justify text-sm font-normal not-italic leading-6 [overflow-wrap:anywhere]">
                          {entry.body.split(/\r?\n/).map((paragraph, index) => (
                            <p key={index} className="min-h-6 indent-0">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                        {state.canWrite ? (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {deleting === entry.id ? (
                              <>
                                <span role="status" className="text-sm">
                                  {t("deleteConfirm")}
                                </span>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void save("delete", entry.id)}
                                  className={BUTTON}
                                >
                                  {t("yes")}
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setDeleting(null)}
                                  className={BUTTON}
                                >
                                  {t("no")}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  disabled={busy || Boolean(editor)}
                                  onClick={() => {
                                    setEditor({ kind: "edit", id: entry.id });
                                    setBody(entry.body);
                                    setDeleting(null);
                                  }}
                                  className={BUTTON}
                                >
                                  {t("edit")}
                                </button>
                                <button
                                  type="button"
                                  disabled={busy || Boolean(editor)}
                                  onClick={() => setDeleting(entry.id)}
                                  className={BUTTON}
                                >
                                  {t("delete")}
                                </button>
                              </>
                            )}
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            {state.canWrite || editor?.kind === "create" ? (
              <div className="mt-5" data-note-create>
                {editor?.kind === "create" ? (
                  <>
                    {textarea(t("create"))}
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        disabled={busy || !validBody || !state.canWrite}
                        onClick={() => void save("create")}
                        className={BUTTON}
                      >
                        {t("saveEntry")}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditor(null);
                          setBody("");
                        }}
                        className={BUTTON}
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={busy || Boolean(editor)}
                    onClick={() => {
                      setEditor({ kind: "create" });
                      setBody("");
                      setDeleting(null);
                      setScrollVersion((value) => value + 1);
                    }}
                    className={BUTTON}
                  >
                    {t("create")}
                  </button>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
      {busy ? (
        <p role="status" className="sr-only">
          {t("saving")}
        </p>
      ) : null}
    </section>
  );
}

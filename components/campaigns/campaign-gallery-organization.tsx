"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import type { CampaignGalleryCategory } from "@/lib/campaign-handouts/contracts";
import { normalizeCampaignGalleryName } from "@/lib/campaign-handouts/organization";
import type { CampaignGalleryOrganization } from "@/lib/campaign-handouts/use-organization";
import { deleteCampaignGalleryImage } from "@/lib/campaign-handouts/storage";
import { createClient } from "@/utils/supabase/client";

const buttonClass = "min-h-11 rounded border border-neutral-500 px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:opacity-50";
const inputClass = "mt-1 min-h-11 w-full min-w-0 rounded border border-neutral-500 bg-white px-2 py-2 text-neutral-950";

function GalleryNameForm({ label, initialName = "", onSave, onCancel }: {
  label: string; initialName?: string; onSave(name: string): Promise<void>; onCancel(): void;
}) {
  const t = useTranslations("CampaignGalleryOrganization");
  const [value, setValue] = useState(initialName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    const name = normalizeCampaignGalleryName(value);
    if (!name) { setError(t("invalidName")); return; }
    lock.current = true; setPending(true); setError(null);
    try { await onSave(name); onCancel(); }
    catch { setError(t("saveError")); }
    finally { lock.current = false; setPending(false); }
  }
  return <form onSubmit={save} className="grid min-w-0 gap-2" aria-busy={pending}>
    <label className="min-w-0 text-sm font-medium">{label}
      <input autoFocus value={value} maxLength={510} disabled={pending} className={inputClass}
        onChange={(event) => { setValue(event.target.value); setError(null); }} />
    </label>
    {error ? <p role="alert" className="break-words text-sm text-red-800">{error}</p> : null}
    <div className="flex flex-wrap gap-2">
      <button type="submit" disabled={pending} className={buttonClass}>{t(pending ? "saving" : "save")}</button>
      <button type="button" disabled={pending} onClick={onCancel} className={buttonClass}>{t("cancel")}</button>
    </div>
  </form>;
}

export function CampaignGalleryFolders({ organization, category, folderId, onFolderChange, editable }: {
  organization: CampaignGalleryOrganization; category: CampaignGalleryCategory; folderId: string | null;
  onFolderChange(folderId: string | null): void; editable: boolean;
}) {
  const t = useTranslations("CampaignGalleryOrganization");
  const galleryT = useTranslations("CampaignHandouts");
  const [editing, setEditing] = useState<"create" | "rename" | null>(null);
  const folders = organization.folders.filter((folder) => folder.category === category);
  const current = folders.find((folder) => folder.id === folderId);
  const categoryName = galleryT(category === "maps_plans" ? "categories.mapsPlans" : `categories.${category}`);
  const unavailable = organization.loading || organization.loadError;
  return <section className="min-w-0 rounded-lg border border-neutral-400 bg-neutral-50 p-3 text-neutral-950" aria-label={t("folders")}>
    <nav aria-label={t("location")} className="flex min-w-0 flex-wrap items-center gap-2">
      <button type="button" className={buttonClass} onClick={() => { setEditing(null); onFolderChange(null); }}
        aria-current={current ? undefined : "page"}>{categoryName} / {t("root")}</button>
      {current ? <><span aria-hidden="true">/</span><span className="min-w-0 break-all font-semibold" aria-current="page">{current.name}</span></> : null}
    </nav>
    {organization.loading ? <p role="status" className="mt-2 text-sm">{t("loading")}</p>
      : organization.loadError ? <div className="mt-2"><p role="alert" className="text-sm text-red-800">{t("loadError")}</p>
        <button type="button" onClick={organization.retry} className={buttonClass}>{t("retry")}</button></div> : null}
    {!unavailable && !current && folders.length > 0 ? <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {folders.map((folder) => <li className="min-w-0" key={folder.id}>
        <button type="button" onClick={() => { setEditing(null); onFolderChange(folder.id); }} title={folder.name}
          className={`${buttonClass} w-full min-w-0 break-all text-left`}>{t("openFolder", { name: folder.name })}</button>
      </li>)}
    </ul> : null}
    {editable && !unavailable ? <div className="mt-3">
      {editing ? <GalleryNameForm key={`${editing}:${current?.id ?? category}`} label={t(editing === "create" ? "folderName" : "renameFolder")}
        initialName={editing === "rename" ? current?.name : ""}
        onSave={(name) => organization.saveFolder(category, name, editing === "rename" ? current?.id : undefined)}
        onCancel={() => setEditing(null)} />
        : current ? <button type="button" onClick={() => setEditing("rename")} className={buttonClass}>{t("renameFolder")}</button>
          : <button type="button" onClick={() => setEditing("create")} className={buttonClass}>{t("createFolder")}</button>}
    </div> : null}
  </section>;
}

export function CampaignGalleryImageActions({
  organization, campaignId, imageId, category, displayName, storagePath,
  onDeleted, beforeDelete, onDeletePendingChange, disabled = false,
}: {
  organization: CampaignGalleryOrganization; imageId: string; category: CampaignGalleryCategory; displayName: string;
  campaignId: string; storagePath: string; onDeleted(): void;
  beforeDelete?(): Promise<boolean>; onDeletePendingChange?(pending: boolean): void; disabled?: boolean;
}) {
  const t = useTranslations("CampaignGalleryOrganization");
  const handouts = useTranslations("CampaignHandouts");
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const openAtEnd = useRef(false);
  const restoreFocus = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [action, setAction] = useState<"rename" | "move" | null>(null);
  const currentFolder = organization.locations.find((location) => location.image_id === imageId)?.folder_id ?? "";
  const [destination, setDestination] = useState(currentFolder);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const lock = useRef(false);

  function closeMenu() {
    menuRef.current?.hidePopover();
    triggerRef.current?.focus({ preventScroll: true });
  }

  function positionMenu() {
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!menu || !trigger) return;
    const anchor = trigger.getBoundingClientRect();
    const bounds = menu.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    const below = anchor.bottom + 4;
    const preferredTop = below + bounds.height <= height - 8 ? below : anchor.top - bounds.height - 4;
    menu.style.left = `${Math.max(8, Math.min(anchor.right - bounds.width, width - bounds.width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(preferredTop, height - bounds.height - 8))}px`;
  }

  useEffect(() => {
    if (!menuOpen) return;
    function dismissOnScroll(event: Event) {
      if (event.target !== menuRef.current) menuRef.current?.hidePopover();
    }
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", dismissOnScroll, true);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", dismissOnScroll, true);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!action && !deleting && restoreFocus.current) {
      restoreFocus.current = false;
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [action, deleting]);

  function closeEditor() {
    restoreFocus.current = true;
    setAction(null);
  }

  function menuKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" || event.key === "Tab") {
      if (event.key === "Escape") event.preventDefault();
      closeMenu();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=menuitem]"));
    const index = items.findIndex((item) => item === document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
      : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next]?.focus({ preventScroll: true });
  }

  async function deleteImage() {
    closeMenu();
    if (disabled || lock.current || !window.confirm(handouts("deleteConfirm", { name: displayName }))) return;
    lock.current = true;
    setDeleting(true);
    setDeleteError(false);
    onDeletePendingChange?.(true);
    try {
      if (beforeDelete && !(await beforeDelete())) {
        setDeleteError(true);
        return;
      }
      const result = await deleteCampaignGalleryImage(createClient(), { campaignId, imageId, storagePath });
      if (result.ok) onDeleted();
      else setDeleteError(true);
    } catch {
      setDeleteError(true);
    } finally {
      lock.current = false;
      restoreFocus.current = true;
      setDeleting(false);
      onDeletePendingChange?.(false);
    }
  }

  async function move(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setPending(true); setError(false);
    try { await organization.moveImage(imageId, destination || null); closeEditor(); }
    catch { setError(true); }
    finally { lock.current = false; setPending(false); }
  }
  const actionsLabel = t("imageActionsNamed", { name: displayName });
  const itemClass = "block min-h-11 w-full rounded px-3 text-left text-sm hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600";
  return <div className="min-w-0 border-t border-neutral-300 bg-neutral-50 text-neutral-950" data-gallery-image-actions={imageId}>
    <div className="flex min-w-0 items-center gap-2 pl-3">
      <p className="min-w-0 flex-1 truncate text-sm font-semibold" title={displayName}>{displayName}</p>
      <button type="button" ref={triggerRef} popoverTarget={menuId} aria-haspopup="menu" aria-controls={menuId}
        aria-expanded={menuOpen} aria-label={actionsLabel} title={actionsLabel}
        disabled={disabled || action !== null || deleting || organization.loading || organization.loadError}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          openAtEnd.current = event.key === "ArrowUp";
          menuRef.current?.showPopover();
        }}
        className="min-h-11 min-w-11 shrink-0 rounded text-xl hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600 disabled:opacity-50">
        <span aria-hidden="true">⋮</span>
      </button>
    </div>
    <div id={menuId} ref={menuRef} popover="auto" role="menu" aria-label={actionsLabel}
      className="fixed inset-auto m-0 max-h-[calc(100dvh-1rem)] w-40 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-lg border border-neutral-400 bg-white p-1 text-neutral-950 shadow-lg"
      onKeyDown={menuKeys}
      onToggle={(event) => {
        const open = event.newState === "open";
        setMenuOpen(open);
        if (open) {
          positionMenu();
          const items = event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=menuitem]");
          items[openAtEnd.current ? items.length - 1 : 0]?.focus({ preventScroll: true });
          openAtEnd.current = false;
        }
      }}>
      <button type="button" role="menuitem" tabIndex={-1} className={itemClass}
        onClick={() => { closeMenu(); setAction("rename"); }}>{t("renameAction")}</button>
      <button type="button" role="menuitem" tabIndex={-1} className={itemClass}
        onClick={() => { closeMenu(); setDestination(currentFolder); setError(false); setAction("move"); }}>{t("moveAction")}</button>
      <button type="button" role="menuitem" tabIndex={-1} className={`${itemClass} text-red-800`}
        onClick={deleteImage}>{t("deleteAction")}</button>
    </div>
    {deleting ? <p role="status" className="px-3 pb-2 text-sm">{handouts("deletingStatus")}</p> : null}
    {deleteError ? <p role="alert" className="px-3 pb-2 text-sm text-red-800">{handouts("deleteError")}</p> : null}
    {action === "rename" ? <div className="p-2"><GalleryNameForm label={t("imageName")} initialName={displayName}
      onSave={(name) => organization.renameImage(imageId, name)} onCancel={closeEditor} /></div>
      : action === "move" ? <form onSubmit={move} className="grid min-w-0 gap-2 p-2" aria-busy={pending}>
        <label className="min-w-0 text-sm font-medium">{t("destination")}
          <select value={destination} disabled={pending} onChange={(event) => { setDestination(event.target.value); setError(false); }} className={inputClass}>
            <option value="">{t("root")}</option>
            {organization.folders.filter((folder) => folder.category === category).map((folder) =>
              <option key={folder.id} value={folder.id}>{folder.name}</option>)}
          </select>
        </label>
        {error ? <p role="alert" className="text-sm text-red-800">{t("saveError")}</p> : null}
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={pending} className={buttonClass}>{t(pending ? "saving" : "save")}</button>
          <button type="button" disabled={pending} onClick={closeEditor} className={buttonClass}>{t("cancel")}</button></div>
      </form> : null}
  </div>;
}

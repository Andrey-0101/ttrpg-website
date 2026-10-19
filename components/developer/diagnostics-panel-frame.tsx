"use client";

import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { developerEnglish as text } from "@/lib/developer/english";
import {
  clampPanelPosition,
  defaultPanelPosition,
  type PanelPosition,
  type PanelViewport,
} from "@/lib/developer/panel-position";

function viewport(): PanelViewport {
  const visible = window.visualViewport;
  return {
    left: visible?.offsetLeft ?? 0,
    top: visible?.offsetTop ?? 0,
    width: visible?.width ?? window.innerWidth,
    height: visible?.height ?? window.innerHeight,
  };
}

const CONTROL = "flex min-h-9 min-w-9 items-center justify-center rounded px-2 focus-visible:outline-2 disabled:opacity-50";

export default function DiagnosticsPanelFrame({
  open,
  status,
  closeDisabled,
  onClose,
  children,
}: {
  open: boolean;
  status: string;
  closeDisabled: boolean;
  onClose(): void;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const [visible, setVisible] = useState<PanelViewport | null>(null);
  const panel = useRef<HTMLElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; origin: PanelPosition } | null>(null);
  const bodyId = useId();

  useEffect(() => {
    if (!open || !panel.current) return;
    const element = panel.current;
    let frame = 0;
    const measure = () => {
      const bounds = viewport();
      const size = element.getBoundingClientRect();
      setVisible(bounds);
      setPosition((current) => {
        const next = clampPanelPosition(current ?? defaultPanelPosition(size, bounds), size, bounds);
        return current?.x === next.x && current?.y === next.y ? current : next;
      });
    };
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    schedule();
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      drag.current = null;
    };
  }, [open]);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0 || !panel.current) return;
    if (
      event.target instanceof Element &&
      event.target.closest("button, a, input, select, textarea, summary, [role='button'], [contenteditable]")
    ) return;
    const rect = panel.current.getBoundingClientRect();
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      origin: { x: rect.left, y: rect.top },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId || !panel.current) return;
    setPosition(clampPanelPosition(
      {
        x: current.origin.x + event.clientX - current.x,
        y: current.origin.y + event.clientY - current.y,
      },
      panel.current.getBoundingClientRect(),
      viewport(),
    ));
  }

  function resetPosition() {
    if (panel.current) setPosition(defaultPanelPosition(panel.current.getBoundingClientRect(), viewport()));
  }

  if (!open) return null;
  return (
    <aside
      ref={panel}
      aria-label={text.wrench}
      data-diagnostics-panel
      data-collapsed={collapsed}
      className={`fixed z-50 flex max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-1rem)] flex-col rounded-lg border bg-white text-sm text-black shadow-xl ${collapsed ? "w-fit" : "w-80"}`}
      style={{
        left: position?.x,
        top: position?.y ?? 80,
        right: position ? undefined : 12,
        maxWidth: visible ? Math.max(0, visible.width - 16) : undefined,
        maxHeight: visible ? Math.max(0, visible.height - 16) : undefined,
      }}
    >
      <div
        data-diagnostics-panel-header
        className="flex shrink-0 touch-none select-none items-center justify-between gap-1 rounded-t-lg px-2 py-1 cursor-move"
        title={text.drag}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
        onLostPointerCapture={() => { drag.current = null; }}
      >
        <span className="px-2" aria-hidden="true">🔧</span>
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            aria-label={collapsed ? text.restore : text.minimise}
            title={collapsed ? text.restore : text.minimise}
            aria-expanded={!collapsed}
            aria-controls={bodyId}
            onClick={() => setCollapsed((current) => !current)}
            className={`${CONTROL} min-w-0 gap-2`}
          >
            {collapsed ? <span className="min-w-0 break-words text-left text-xs" role="status">{text.panel}: {status}</span> : null}
            <span aria-hidden="true">{collapsed ? "↗" : "−"}</span>
          </button>
          <button type="button" aria-label={text.resetPosition} title={text.resetPosition} onClick={resetPosition} className={CONTROL}>
            <span aria-hidden="true">⌖</span>
          </button>
          <button type="button" aria-label={text.close} title={text.close} onClick={onClose} disabled={closeDisabled} className={CONTROL}>
            ×
          </button>
        </div>
      </div>
      <div id={bodyId} hidden={collapsed} className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
        {children}
      </div>
    </aside>
  );
}

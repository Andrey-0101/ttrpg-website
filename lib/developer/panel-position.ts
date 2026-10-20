export type PanelPosition = { x: number; y: number };
export type PanelSize = { width: number; height: number };
export type PanelViewport = PanelSize & { left: number; top: number };

const MARGIN = 8;

export function clampPanelPosition(
  position: PanelPosition,
  size: PanelSize,
  viewport: PanelViewport,
): PanelPosition {
  const left = viewport.left + MARGIN;
  const top = viewport.top + MARGIN;
  return {
    x: Math.max(left, Math.min(position.x, viewport.left + viewport.width - size.width - MARGIN)),
    y: Math.max(top, Math.min(position.y, viewport.top + viewport.height - size.height - MARGIN)),
  };
}

export function defaultPanelPosition(size: PanelSize, viewport: PanelViewport): PanelPosition {
  return clampPanelPosition(
    { x: viewport.left + viewport.width - size.width - 12, y: viewport.top + 80 },
    size,
    viewport,
  );
}

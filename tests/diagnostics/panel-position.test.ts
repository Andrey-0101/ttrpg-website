import assert from "node:assert/strict";
import test from "node:test";
import { clampPanelPosition, defaultPanelPosition } from "../../lib/developer/panel-position";

test("dragging clamps both expanded and compact panels to every viewport edge", () => {
  const viewport = { left: 0, top: 0, width: 1280, height: 720 };
  for (const size of [{ width: 320, height: 500 }, { width: 260, height: 46 }]) {
    assert.deepEqual(clampPanelPosition({ x: -2000, y: -2000 }, size, viewport), { x: 8, y: 8 });
    assert.deepEqual(clampPanelPosition({ x: 2000, y: 2000 }, size, viewport), {
      x: 1280 - size.width - 8, y: 720 - size.height - 8,
    });
  }
});

test("resizing or restoring a wider panel brings an old position into the narrow viewport", () => {
  const viewport = { left: 0, top: 0, width: 320, height: 480 };
  assert.deepEqual(clampPanelPosition({ x: 900, y: 600 }, { width: 304, height: 464 }, viewport), { x: 8, y: 8 });
  assert.deepEqual(clampPanelPosition({ x: 40, y: 8 }, { width: 304, height: 300 }, viewport), { x: 8, y: 8 });
});

test("default/reset positions respect short or offset visual viewports", () => {
  assert.deepEqual(defaultPanelPosition({ width: 320, height: 400 }, { left: 0, top: 0, width: 1280, height: 720 }), { x: 948, y: 80 });
  assert.deepEqual(defaultPanelPosition({ width: 284, height: 184 }, { left: 50, top: 100, width: 300, height: 200 }), { x: 58, y: 108 });
});

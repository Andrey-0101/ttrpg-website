import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { transpileModule, ModuleKind, ScriptTarget, JsxEmit } from "typescript";
import * as React from "react";
import * as jsx from "react/jsx-runtime";
import { developerEnglish } from "../../lib/developer/english";
import * as positions from "../../lib/developer/panel-position";

// Run the actual component's event handlers with deterministic React hook/DOM boundaries.
function frameHarness() {
  const hooks: unknown[] = [];
  let index = 0;
  let closes = 0;
  const captures: number[] = [];
  const content = React.createElement("p", null, "Current run content");
  class Target {
    constructor(private interactive = false) {}
    closest() { return this.interactive ? this : null; }
  }
  type Node = React.ReactElement<Record<string, unknown>>;
  const exports: { default?: (props: Record<string, unknown>) => Node | null } = {};
  const source = transpileModule(readFileSync("components/developer/diagnostics-panel-frame.tsx", "utf8"), {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022, jsx: JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(source, {
    exports, Element: Target,
    window: { innerWidth: 1280, innerHeight: 720 },
    require: (name: string) => {
      if (name === "react/jsx-runtime") return jsx;
      if (name.endsWith("/english")) return { developerEnglish };
      if (name.endsWith("/panel-position")) return positions;
      if (name === "react") return {
        useState(initial: unknown) {
          const slot = index++;
          if (!(slot in hooks)) hooks[slot] = initial;
          return [hooks[slot], (next: unknown) => {
            hooks[slot] = typeof next === "function" ? next(hooks[slot]) : next;
          }];
        },
        useRef(initial: unknown) {
          const slot = index++;
          if (!(slot in hooks)) hooks[slot] = { current: initial };
          return hooks[slot];
        },
        useId: () => "fixture-panel-body",
        useEffect: () => {},
      };
      throw new Error(name);
    },
  });
  const render = (open = true, busy = false) => {
    index = 0;
    const tree = exports.default!({ open, status: busy ? "Working…" : "Recording", closeDisabled: busy,
      onClose: () => { closes++; }, children: content });
    if (tree) {
      (tree.props.ref as { current: unknown }).current = {
        getBoundingClientRect: () => ({ left: 900, top: 80, width: 320, height: 400 }),
      };
    }
    return tree;
  };
  const header = (tree: Node) => (tree.props.children as Node[])[0];
  const body = (tree: Node) => (tree.props.children as Node[])[1];
  const buttons = (tree: Node) => ((header(tree).props.children as Node[])[1].props.children as Node[]);
  const invoke = (node: Node, name: string, event?: unknown) =>
    (node.props[name] as (event?: unknown) => void)(event);
  const pointer = (interactive = false, pointerType = "mouse") => ({
    target: new Target(interactive), pointerType, isPrimary: true, button: 0,
    pointerId: 7, clientX: 930, clientY: 100,
    currentTarget: { setPointerCapture: (id: number) => captures.push(id) },
    preventDefault() {},
  });
  return { render, header, body, buttons, invoke, pointer, captures, content,
    get closes() { return closes; } };
}

test("minimise/restore while exporting only hides the body and keeps content, position and close state", () => {
  const h = frameHarness();
  let tree = h.render(true, true)!;
  assert.equal(h.buttons(tree)[2].props.disabled, true);
  h.invoke(h.header(tree), "onPointerDown", h.pointer());
  h.invoke(h.header(tree), "onPointerMove", { pointerId: 7, clientX: 100, clientY: 100 });
  h.invoke(h.header(tree), "onPointerUp");
  tree = h.render(true, true)!;
  const left = (tree.props.style as { left: number }).left;
  h.invoke(h.buttons(tree)[0], "onClick");
  tree = h.render(true, true)!;
  assert.equal(tree.props["data-collapsed"], true);
  assert.equal(h.body(tree).props.hidden, true);
  assert.equal(h.body(tree).props.children, h.content);
  assert.equal((tree.props.style as { left: number }).left, left);
  assert.equal(h.buttons(tree)[0].props["aria-label"], "Restore diagnostics panel");
  assert.equal(h.closes, 0);
  assert.equal(h.render(false), null);
  tree = h.render(true, true)!;
  assert.equal(tree.props["data-collapsed"], true);
  h.invoke(h.buttons(tree)[0], "onClick");
  tree = h.render()!;
  assert.equal(h.body(tree).props.hidden, false);
  h.invoke(h.buttons(tree)[2], "onClick");
  assert.equal(h.closes, 1, "X delegates only to the existing close callback");
});

for (const pointerType of ["mouse", "touch"]) {
  test(`header ${pointerType} drag captures the pointer, clamps bounds and stops on cancellation`, () => {
    const h = frameHarness();
    let tree = h.render()!;
    h.invoke(h.header(tree), "onPointerDown", h.pointer(false, pointerType));
    h.invoke(h.header(tree), "onPointerMove", { pointerId: 7, clientX: -1000, clientY: -1000 });
    tree = h.render()!;
    assert.deepEqual(h.captures, [7]);
    assert.equal((tree.props.style as {left:number}).left, 8);
    assert.equal((tree.props.style as {top:number}).top, 8);
    h.invoke(h.header(tree), "onPointerCancel");
    h.invoke(h.header(tree), "onPointerMove", { pointerId: 7, clientX: 1500, clientY: 1000 });
    assert.equal((h.render()!.props.style as {left:number}).left, 8);
    assert.equal(h.closes, 0);
  });
}

test("interactive header controls never start a drag; reset is a separate position-only action", () => {
  const h = frameHarness();
  let tree = h.render()!;
  h.invoke(h.header(tree), "onPointerDown", h.pointer(true));
  h.invoke(h.header(tree), "onPointerMove", { pointerId: 7, clientX: 0, clientY: 0 });
  tree = h.render()!;
  assert.equal((tree.props.style as {left?:number}).left, undefined);
  assert.deepEqual(h.captures, []);
  h.invoke(h.buttons(tree)[1], "onClick");
  tree = h.render()!;
  assert.equal((tree.props.style as {left:number}).left, 948);
  assert.equal((tree.props.style as {top:number}).top, 80);
  assert.equal(h.closes, 0);
});

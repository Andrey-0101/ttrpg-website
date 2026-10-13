import fs from "node:fs";
import cp from "node:child_process";
import ts from "typescript";
const baseline = cp.execFileSync(
  "git",
  ["show", "a51ea6819e1352079e0d6815787f4f629ab5fc15:types/database.types.ts"],
  { encoding: "utf8" },
);
function fields(source) {
  const file = ts.createSourceFile("types.ts", source, ts.ScriptTarget.Latest, true);
  const database = file.statements.find(
    (node) => ts.isTypeAliasDeclaration(node) && node.name.text === "Database",
  );
  const schema = database.type.members.find((node) => node.name.getText(file) === "public");
  const printer = ts.createPrinter();
  return Object.fromEntries(
    schema.type.members.map((group) => [
      group.name.getText(file),
      Object.fromEntries(
        group.type.members.map((member) => [
          member.name.getText(file),
          printer
            .printNode(ts.EmitHint.Unspecified, member, file)
            .replace(/\s+ComputedFields: never;/g, ""),
        ]),
      ),
    ]),
  );
}
const before = fields(baseline);
const after = fields(fs.readFileSync("types/database.types.ts", "utf8"));
let unrelated = false;
for (const group of Object.keys(before)) {
  const added = Object.keys(after[group]).filter((name) => !before[group][name]);
  const removed = Object.keys(before[group]).filter((name) => !after[group][name]);
  const changed = Object.keys(before[group]).filter(
    (name) => after[group][name] && before[group][name] !== after[group][name],
  );
  console.log(group, JSON.stringify({ added, removed, changed }));
  unrelated ||= removed.length > 0 || changed.length > 0;
}
process.exitCode = unrelated ? 1 : 0;

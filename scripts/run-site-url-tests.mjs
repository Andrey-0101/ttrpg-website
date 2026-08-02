import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const cacheDirectory = resolve(
  projectRoot,
  "node_modules/.cache/site-url-tests",
);

function runNodeScript(scriptPath, args = []) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: projectRoot,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

let exitCode = 0;

try {
  rmSync(cacheDirectory, { recursive: true, force: true });

  exitCode = runNodeScript(
    resolve(projectRoot, "node_modules/typescript/bin/tsc"),
    ["--project", "tsconfig.site-url.test.json"],
  );

  if (exitCode === 0) {
    exitCode = runNodeScript(
      resolve(cacheDirectory, "tests/site-url.test.js"),
    );
  }
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  rmSync(cacheDirectory, { recursive: true, force: true });
}

process.exitCode = exitCode;

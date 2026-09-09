// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

// SessionStart hook that warns when a Claude Code plugin this repo enables is
// not installed on this machine.
//
// The enabledPlugins map in .claude/settings.json does not install plugins. It
// only turns on plugins the developer has already installed, so an enabled but
// uninstalled plugin silently loads no skills and no hooks. This script compares
// the enabled set, with .claude/settings.local.json overrides applied, against
// the install records in ~/.claude/plugins/installed_plugins.json and prints the
// install command for each plugin that is missing. It prints nothing when every
// enabled plugin is installed.
//
// It runs before the repo's dependencies are guaranteed to be present, so it
// uses only Node built-ins.

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function readJson(path) {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf8"));
}

function projectDir() {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  return resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
}

// Plugins this repo turns on, after a developer's local opt-outs.
function enabledPlugins(dir) {
  const enabled = {};
  for (const name of ["settings.json", "settings.local.json"]) {
    Object.assign(
      enabled,
      readJson(join(dir, ".claude", name)).enabledPlugins ?? {},
    );
  }
  return Object.keys(enabled).filter((id) => enabled[id] === true);
}

// Plugins with at least one install record on this machine, at any scope.
function installedPlugins() {
  const records =
    readJson(join(homedir(), ".claude", "plugins", "installed_plugins.json"))
      .plugins ?? {};
  return new Set(Object.keys(records).filter((id) => records[id]?.length));
}

const installed = installedPlugins();
const missing = enabledPlugins(projectDir())
  .filter((id) => !installed.has(id))
  .sort();
if (missing.length === 0) process.exit(0);

const warnings = missing
  .map(
    (id) =>
      `WARNING: plugin [${id}] is enabled in .claude/settings.json but is not installed on this machine, ` +
      `so its skills and hooks will not load. To fix, run: claude plugin install ${id} --scope project ` +
      `(or in the VS Code extension: / → Manage plugins → Install)`,
  )
  .join("\n");

// systemMessage is shown to the developer at session start. additionalContext
// lands in Claude's context so Claude repeats the fix in its first reply.
process.stdout.write(
  JSON.stringify({
    systemMessage: warnings,
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: `${warnings}\nTell the user about the warnings above at the start of your next reply.`,
    },
  }),
);

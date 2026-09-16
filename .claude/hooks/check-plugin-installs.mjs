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
// the install records in the Claude config directory and prints the commands
// that fix each plugin that is missing. It prints nothing when every enabled
// plugin is installed.
//
// The fix is usually two commands, not one. The extraKnownMarketplaces entry in
// this repo's settings tells a session where the marketplace lives, but it does
// not register that marketplace for the `claude plugin` CLI: a session caches
// the clone under a directory named after the source repo, while the CLI looks
// for one named after the marketplace. Until the developer adds the marketplace
// by hand, `claude plugin install <plugin>@<marketplace>` fails with
// `Plugin "<plugin>" not found in marketplace "<marketplace>"`, and the recovery
// the CLI suggests, `claude plugin marketplace update <marketplace>`, fails too.
// So this script prints the add step first, and only when that marketplace is
// not already registered.
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

// Where Claude Code records installs and marketplace registrations.
function configDir() {
  return process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
}

// One settings key, merged across this repo's settings.json and a developer's
// settings.local.json overrides.
function projectSetting(dir, key) {
  const merged = {};
  for (const name of ["settings.json", "settings.local.json"]) {
    Object.assign(merged, readJson(join(dir, ".claude", name))[key] ?? {});
  }
  return merged;
}

// Plugins this repo turns on, after a developer's local opt-outs.
function enabledPlugins(dir) {
  const enabled = projectSetting(dir, "enabledPlugins");
  return Object.keys(enabled).filter((id) => enabled[id] === true);
}

// Plugins with at least one install record on this machine, at any scope.
function installedPlugins() {
  const records =
    readJson(join(configDir(), "plugins", "installed_plugins.json")).plugins ??
    {};
  return new Set(Object.keys(records).filter((id) => records[id]?.length));
}

// Marketplaces the `claude plugin` CLI already resolves by name.
function registeredMarketplaces() {
  const path = join(configDir(), "plugins", "known_marketplaces.json");
  return new Set(Object.keys(readJson(path)));
}

// The argument `claude plugin marketplace add` takes for a declared source.
function marketplaceSourceArg(source) {
  if (!source) return null;
  if (source.source === "github") return source.repo ?? null;
  if (source.source === "directory") return source.path ?? null;
  return source.url ?? null;
}

const installed = installedPlugins();
const missing = enabledPlugins(projectDir())
  .filter((id) => !installed.has(id))
  .sort();
if (missing.length === 0) process.exit(0);

const declared = projectSetting(projectDir(), "extraKnownMarketplaces");
const registered = registeredMarketplaces();

// Group by marketplace so a shared add step prints once, not once per plugin.
const byMarketplace = new Map();
for (const id of missing) {
  const at = id.lastIndexOf("@");
  const marketplace = at === -1 ? "" : id.slice(at + 1);
  if (!byMarketplace.has(marketplace)) byMarketplace.set(marketplace, []);
  byMarketplace.get(marketplace).push(id);
}

const count = missing.length;
const lines = [
  `WARNING: ${count} Claude Code ${count === 1 ? "plugin" : "plugins"} enabled ` +
    `in .claude/settings.json ${count === 1 ? "is" : "are"} not installed on ` +
    `this machine, so ${count === 1 ? "its" : "their"} skills and hooks will ` +
    `not load: ${missing.join(", ")}.`,
  "To fix, run:",
];

let addsMarketplace = false;
for (const [marketplace, ids] of byMarketplace) {
  const sourceArg = marketplaceSourceArg(declared[marketplace]?.source);
  if (sourceArg && !registered.has(marketplace)) {
    lines.push(`  claude plugin marketplace add ${sourceArg}`);
    addsMarketplace = true;
  }
  for (const id of ids) lines.push(`  claude plugin install ${id}`);
}

if (addsMarketplace) {
  lines.push(
    "The marketplace add step comes first on purpose. This repo declares the " +
      "marketplace for sessions, but the claude plugin CLI does not see it " +
      'until you add it, and install alone fails with "not found in ' +
      'marketplace".',
    // An older CLI rejects catalog keys it does not know, so the add step
    // fails before it can help. Only a version bump fixes that.
    'If the add step itself fails with "Unrecognized key", your Claude Code ' +
      "is too old for the catalog's schema. Run claude update, then try " +
      "again. This marketplace needs v2.1.193 or later.",
  );
}

lines.push(
  "Install at the default user scope. Do not pass --scope project: that " +
    "rewrites the checked-in .claude/settings.json. In the VS Code extension, " +
    "use / → Manage plugins → Install instead.",
);

const warnings = lines.join("\n");

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

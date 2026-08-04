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

/* eslint-disable no-console -- this is a CLI script; its report is the output */

/**
 * Generates `libs/design-system/src/styles/ds001-tokens.ts` from the DS001
 * Figma variable exports checked into this directory.
 *
 * Run with:  nx run design-system:generate-ds001-tokens
 *
 * To refresh the sources, re-export the DS001 variable collections from Figma
 * (file qkH6i43t5w27PjX2f6zdLx) and overwrite the JSON files here, keeping the
 * same filenames.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../../src/styles/ds001-tokens.ts");

/** The Primitives mode we generate from. */
const PRIMITIVE_MODE = "default value v1 (system v2 + staging)";

// Each source is read via a literal path resolved against this module's own
// URL. Passing a variable to readFileSync would make the path attacker-
// controllable in principle, and static analysis flags it as such.
const primitives = JSON.parse(
  readFileSync(
    new URL("./primitives.default-v1.json", import.meta.url),
    "utf8",
  ),
);
const repoClosest = JSON.parse(
  readFileSync(
    new URL("./primitives.repo-closest.json", import.meta.url),
    "utf8",
  ),
);
const semantics = JSON.parse(
  readFileSync(new URL("./semantics.json", import.meta.url), "utf8"),
);

/** Walks a DTCG token tree into a flat map of "A/B/c" -> token object. */
function flatten(tree, path = [], out = {}) {
  for (const [key, value] of Object.entries(tree)) {
    if (key === "$extensions") continue;
    if (value && typeof value === "object" && "$value" in value) {
      out[[...path, key].join("/")] = value;
    } else if (value && typeof value === "object") {
      flatten(value, [...path, key], out);
    }
  }
  return out;
}

const flatPrimitives = flatten(primitives);
const flatRepoClosest = flatten(repoClosest);
const flatSemantics = flatten(semantics);

/**
 * Some primitives alias other primitives as "{Spacer.space-8}".
 * Resolves those to their concrete value.
 */
function resolvePrimitive(token, seen = new Set()) {
  const raw = token.$value;
  if (typeof raw !== "string" || !/^\{.+\}$/.test(raw)) return raw;
  const target = raw.slice(1, -1).replace(/\./g, "/");
  if (seen.has(target)) return raw;
  seen.add(target);
  const next = flatPrimitives[target];
  return next ? resolvePrimitive(next, seen) : raw;
}

const round = (n, places) => Number(n.toFixed(places));

/** Figma colors carry 0-1 components plus a hex of the un-alpha'd color. */
function cssColor(value) {
  const [r, g, b] = value.components.map((c) => Math.round(c * 255));
  const alpha = value.alpha ?? 1;
  if (alpha >= 0.999) return (value.hex ?? "").toUpperCase();
  return `rgba(${r}, ${g}, ${b}, ${round(alpha, 3)})`;
}

/**
 * Splits a Figma color into the parts a designer needs to reproduce it: the
 * base hex, and the opacity to set on top of it. Figma stores these
 * separately, and the hex alone is wrong for any token with transparency.
 */
function colorParts(type, value) {
  if (type !== "color" || !value || typeof value !== "object") return {};
  return {
    baseHex: (value.hex ?? "").toUpperCase() || undefined,
    alpha: value.alpha === undefined ? 1 : round(value.alpha, 4),
  };
}

function cssValue(type, value) {
  if (type === "color") return cssColor(value);
  return value;
}

/** "slate-06 (repo)" -> "slate06Repo" */
function camel(name) {
  const words = name
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(" ");
  return words
    .map((w, i) =>
      i === 0
        ? w.charAt(0).toLowerCase() + w.slice(1)
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join("");
}

/**
 * A variable with no value set in the selected Figma mode exports as a
 * fallback zero / black / white rather than as "unset". We can only detect
 * that by comparing against the other mode, so this is a heuristic and is
 * surfaced in the docs page rather than silently corrected.
 */
function isProbablyUnset(path, resolved, type) {
  const other = flatRepoClosest[path];
  if (!other) return false;
  const otherValue = resolvePrimitive(other);
  if (type === "number") {
    return resolved === 0 && typeof otherValue === "number" && otherValue !== 0;
  }
  if (type === "color" && resolved?.hex && otherValue?.hex) {
    const isBlackOrWhite =
      resolved.hex === "#000000" || resolved.hex === "#FFFFFF";
    return isBlackOrWhite && otherValue.hex !== resolved.hex;
  }
  return false;
}

/** The same token's value in the "Repo · closest" mode, for comparison. */
function repoClosestValueFor(path, type) {
  const other = flatRepoClosest[path];
  if (!other) return undefined;
  return cssValue(type, resolvePrimitive(other));
}

const tokens = [];

for (const [path, token] of Object.entries(flatPrimitives)) {
  const resolved = resolvePrimitive(token);
  const type = token.$type;
  tokens.push({
    path,
    name: path.split("/").pop(),
    collection: "Primitives",
    group: path.split("/").slice(0, -1).join("/"),
    type,
    value: cssValue(type, resolved),
    ...colorParts(type, resolved),
    description: token.$description || undefined,
    aliasOf: undefined,
    unset: isProbablyUnset(path, resolved, type) || undefined,
    repoClosestValue: repoClosestValueFor(path, type),
  });
}

for (const [path, token] of Object.entries(flatSemantics)) {
  const type = token.$type;
  const alias = token.$extensions?.["com.figma.aliasData"];
  tokens.push({
    path,
    name: path.split("/").pop(),
    collection: "Semantics",
    group: path.split("/").slice(0, -1).join("/"),
    type,
    value: cssValue(type, token.$value),
    ...colorParts(type, token.$value),
    description: token.$description || undefined,
    aliasOf:
      alias?.targetVariableSetName === "Primitives"
        ? alias.targetVariableName
        : undefined,
    unset: undefined,
    repoClosestValue: undefined,
  });
}

/** Builds the nested convenience object, e.g. semantics.color.text.textAction */
function nest(collection) {
  const root = {};
  for (const t of tokens.filter((x) => x.collection === collection)) {
    const segments = [...t.group.split("/").map(camel), camel(t.name)];
    let cursor = root;
    segments.forEach((segment, i) => {
      if (i === segments.length - 1) cursor[segment] = t.value;
      else cursor = cursor[segment] ??= {};
    });
  }
  return root;
}

const unsetCount = tokens.filter((t) => t.unset).length;

// No license header here: the notice/notice ESLint rule inserts an
// up-to-date one when the file is linted.
const body = `/**
 * DS001 design tokens, generated from Figma variable exports.
 *
 * DO NOT EDIT BY HAND. Regenerate with:
 *   nx run design-system:generate-ds001-tokens
 *
 * Source file:      https://www.figma.com/design/qkH6i43t5w27PjX2f6zdLx/DS001
 * Primitives mode:  ${PRIMITIVE_MODE}
 * Semantics mode:   default
 *
 * Reference only. These tokens are rendered by ds001-tokens.stories.tsx and are
 * deliberately NOT exported from the styles barrel, so they are not reachable
 * from other apps. \`palette\` does not use them either. Use \`palette\` in
 * product code until that changes.
 */

export type DS001Collection = "Primitives" | "Semantics";

export interface DS001Token {
  /** Full Figma variable path, e.g. "Color/Text/text-action" */
  path: string;
  /** Leaf name, e.g. "text-action" */
  name: string;
  collection: DS001Collection;
  /** Path minus the leaf, e.g. "Color/Text" */
  group: string;
  type: "color" | "number" | "string";
  /** CSS-ready string for colors, raw value otherwise */
  value: string | number;
  /**
   * Colors only: the base hex with no transparency applied, as Figma stores
   * it. Set this as the fill, then set \`alpha\` as the opacity.
   */
  baseHex?: string;
  /** Colors only: opacity from 0 to 1. 1 means fully opaque. */
  alpha?: number;
  /** The \`$description\` field from Figma, where one is set */
  description?: string;
  /** For semantics: the primitive this token aliases */
  aliasOf?: string;
  /**
   * True when this variable appears to have no value set in the
   * "${PRIMITIVE_MODE}" mode and Figma exported a fallback
   * zero / black / white instead. Detected by comparing against the
   * "Repo · closest" mode.
   */
  unset?: boolean;
  /** Same token's value in the "Repo · closest" mode, for comparison */
  repoClosestValue?: string | number;
}

/** Every DS001 token, primitives first. ${tokens.length} total, ${unsetCount} flagged as unset. */
export const DS001_TOKENS: DS001Token[] = ${JSON.stringify(tokens, null, 2)};

/** Raw primitive values, e.g. ds001Primitives.color.main.pine3 */
export const ds001Primitives = ${JSON.stringify(nest("Primitives"), null, 2)} as const;

/** Semantic values, e.g. ds001Semantics.color.text.textAction */
export const ds001Semantics = ${JSON.stringify(nest("Semantics"), null, 2)} as const;
`;

writeFileSync(OUT, body);

console.log(`wrote ${OUT}`);
console.log(
  `  primitives: ${tokens.filter((t) => t.collection === "Primitives").length}`,
);
console.log(
  `  semantics:  ${tokens.filter((t) => t.collection === "Semantics").length}`,
);
console.log(`  flagged unset in "${PRIMITIVE_MODE}": ${unsetCount}`);
for (const t of tokens.filter((x) => x.unset)) {
  console.log(
    `    ${t.path} -> ${t.value} (repo-closest: ${t.repoClosestValue})`,
  );
}

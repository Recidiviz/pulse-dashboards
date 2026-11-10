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

const NULL_EQUIVALENTS = new Set([
  "n/a",
  "na",
  "n.a.",
  "n.a",
  "none",
  "not applicable",
  "",
  "unknown",
  "not listed",
  "-",
  "--",
  "—",
  "null",
]);

function isNullEquivalentString(value: string): boolean {
  return NULL_EQUIVALENTS.has(value.trim().toLowerCase());
}

export function sanitizeNulls(root: unknown): unknown {
  if (root == null) return null;
  const rootType = typeof root;
  if (rootType === "string") {
    return isNullEquivalentString(root as string) ? null : root;
  }
  if (rootType !== "object") return root;

  const rootClone: unknown = Array.isArray(root)
    ? [...(root as unknown[])]
    : Object.assign(Object.create(null), root);

  type StackFrame = [Record<string, unknown>, string];
  const stack: StackFrame[] = [];

  const seedObj = rootClone as Record<string, unknown>;
  const seedKeys = Object.keys(seedObj);
  for (let i = seedKeys.length - 1; i >= 0; i--) {
    stack.push([seedObj, seedKeys[i]]);
  }

  while (stack.length > 0) {
    const frame = stack.pop();
    if (frame === undefined) continue;
    const [parent, key] = frame;
    const val = parent[key];

    if (val == null) {
      parent[key] = null;
      continue;
    }

    const type = typeof val;

    if (type === "string") {
      parent[key] = isNullEquivalentString(val as string) ? null : val;
      continue;
    }

    if (type !== "object") continue;

    if (Array.isArray(val)) {
      const cloned = [...val];
      parent[key] = cloned;
      for (let i = cloned.length - 1; i >= 0; i--) {
        stack.push([cloned as unknown as Record<string, unknown>, String(i)]);
      }
      continue;
    }

    const cloned = Object.assign(Object.create(null), val);
    parent[key] = cloned;
    const keys = Object.keys(cloned);
    for (let i = keys.length - 1; i >= 0; i--) {
      stack.push([cloned, keys[i]]);
    }
  }

  return rootClone;
}

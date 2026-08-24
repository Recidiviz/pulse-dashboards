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

// Narrowing a Firestore document down to the fields Typesense is allowed to see.
//
// This is a PRIVACY boundary, not just a payload optimization. Firestore person
// records carry far more than the search index needs, and whatever this file
// emits is what lands in a system that answers live queries. Fields are declared
// per collection and anything undeclared is dropped here, before import — so the
// default is exclusion, and adding a field to the index is an explicit act.

import type { FirestoreDoc } from "~@typesense/client";

import type { CollectionConfig } from "./types";

// Walks a dotted path in the source object and writes the leaf value into the
// output, building any intermediate objects as it goes. Multiple dotted paths
// that share a parent (e.g. metadata.crcFacilities + metadata.crcWorkRelease)
// merge into the same nested object. Missing intermediate keys -> skip
// silently; the field is optional from the projection's perspective.
export function assignNested(
  out: FirestoreDoc,
  src: FirestoreDoc,
  path: string,
): void {
  const parts = path.split(".");
  let cursor: unknown = src;
  for (const p of parts) {
    if (cursor === null || cursor === undefined || typeof cursor !== "object") {
      return;
    }
    const obj = cursor as FirestoreDoc;
    if (!(p in obj)) return;
    cursor = obj[p];
  }
  // `cursor` is the leaf value (may legitimately be null).
  let dst = out;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    const existing = dst[k];
    if (
      existing === null ||
      existing === undefined ||
      typeof existing !== "object"
    ) {
      dst[k] = {};
    }
    dst = dst[k] as FirestoreDoc;
  }
  dst[parts[parts.length - 1]] = cursor;
}

// Projects each declared field from the source Firestore document into the
// import payload. Top-level field names map straight across; dotted names like
// `personName.givenNames` walk into the source's nested structure and
// reconstruct only the declared leaves on the way out. This lets us declare
// specific nested children in the schema without shipping their entire parent
// object — important for residents where `metadata` is large but we only
// index one sub-field.
//
// Order matters:
//   1. Project source fields.
//   2. Apply `derivedFields` — read a source field, map through a lookup,
//      stamp the result into a target field (e.g. `locations.idType` →
//      `system`). Unmapped source values leave the target unset.
//   3. Apply `constantFields` — merges LAST so a constant wins against a
//      colliding source or derived value. Whole point of the mechanism is to
//      stamp a canonical value (e.g. `system: "SUPERVISION"`) regardless of
//      what came from the source doc.
//   4. Set `id` from `docId` — protected against any `constantFields.id` or
//      `derivedFields.into: "id"` attempt.
export function projectFields(
  data: FirestoreDoc,
  fields: string[],
  docId: string,
  constantFields?: Record<string, string>,
  derivedFields?: CollectionConfig["derivedFields"],
): FirestoreDoc {
  const out: FirestoreDoc = {};
  for (const f of fields) {
    if (f.includes(".")) {
      assignNested(out, data, f);
    } else if (f in data) {
      out[f] = data[f];
    }
  }
  if (derivedFields) {
    for (const rule of derivedFields) {
      if ("valueMapping" in rule) {
        const raw = data[rule.from];
        if (typeof raw === "string" && raw in rule.valueMapping) {
          out[rule.into] = rule.valueMapping[raw];
        }
      } else {
        // Conditional copy: only stamp when the guard field matches.
        const guard = data[rule.when.field];
        if (guard === rule.when.equals) {
          const value = data[rule.copyFrom];
          if (typeof value === "string") {
            out[rule.into] = value;
          }
        }
      }
    }
  }
  if (constantFields) {
    Object.assign(out, constantFields);
  }
  out["id"] = docId;
  return out;
}

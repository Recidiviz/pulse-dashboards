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

// What a configured transform NAME means — see CollectionConfig.transform.
// Keep it small: `derivedFields` covers a lookup or a guarded copy.

import {
  deriveOpportunityFields,
  deriveUpdateFields,
  type FirestoreDoc,
} from "~@typesense/client";

/** The projected source document plus its stored id, returning fields to merge. */
export type Transform = (data: FirestoreDoc, docId: string) => FirestoreDoc;

const TRANSFORMS = {
  /** Shared with sync-fn; neither writer may reimplement any part of it. */
  opportunityUpdate: (data, docId) => deriveUpdateFields(data, docId),
  opportunityFields: (data) => deriveOpportunityFields(data),
} satisfies Record<string, Transform>;

export type TransformName = keyof typeof TRANSFORMS;

/**
 * Throws on an unknown name rather than skipping it: a typo in COLLECTIONS_JSON
 * would otherwise import every document without its derived fields.
 */
export function resolveTransform(name: TransformName): Transform {
  const transform: Transform | undefined = TRANSFORMS[name];
  if (!transform) {
    throw new Error(
      `Unknown transform "${name}". Known transforms: ${Object.keys(TRANSFORMS).join(", ")}`,
    );
  }
  return transform;
}

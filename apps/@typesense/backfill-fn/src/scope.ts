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

import type { CollectionConfig } from "./types";

// The Recidiviz state-code shape: `US_` followed by exactly two
// uppercase ASCII letters (US_AZ, US_ID, ...). We validate the SHAPE rather than
// membership in ~auth-utils' `stateCodes` because the ETL trigger fires per
// state as data lands, including states not yet enrolled in a dashboard product
// (so absent from `stateCodes`). Gating on that list would 400 those legitimate
// backfills; the ETL is the authority on which states have data.
const STATE_CODE_PATTERN = /^US_[A-Z]{2}$/;

export function isValidStateCode(raw: unknown): raw is string {
  return typeof raw === "string" && STATE_CODE_PATTERN.test(raw);
}

// Instantiates template configs (currently `opportunities`) that don't
// statically enumerate their sources. The ETL calls backfill-fn once per source
// with `{ collections: ["opportunities"], sourceCollection: "US_XX-..." }`.
export function instantiateFromSourceCollection(
  configs: CollectionConfig[],
  sourceCollection: string | undefined,
): CollectionConfig[] {
  if (!sourceCollection) return configs;
  return configs.map((config) =>
    config.sourceCollection
      ? config
      : {
          ...config,
          sourceCollection,
          docIdOverrides: config.docIdOverrides ?? {
            type: "prefix",
            prefix: sourceCollection,
          },
          constantFields: {
            ...config.constantFields,
            sourceCollection,
          },
        },
  );
}

// Build the Typesense filter_by string used by the prune pass so it only
// touches docs belonging to THIS source's partition of the target collection.
// Multi-source targets rely on this — without it, backfilling
// `US_TN_compliantReporting → opportunities` would prune every LSU doc in
// `opportunities` too. Empty when neither scope is set (whole-target prune).
export function buildPruneFilter(
  constantFields: Record<string, string> | undefined,
  stateCode: string | undefined,
): string | undefined {
  const clauses = new Map<string, string>();
  if (constantFields) {
    for (const [k, v] of Object.entries(constantFields)) clauses.set(k, v);
  }
  if (stateCode) clauses.set("stateCode", stateCode);
  if (clauses.size === 0) return undefined;
  return [...clauses.entries()].map(([k, v]) => `${k}:=${v}`).join(" && ");
}

// Log tag for a collection, optionally scoped to a state: `[clients]` for a
// whole-collection run, `[clients, US_ID]` when scoped. Collections run
// concurrently, so partitions interleave in Cloud Logging and every line needs
// to say which one it came from.
export function logTag(name: string, stateCode?: string): string {
  const suffix = stateCode ? `, ${stateCode}` : "";
  return `[${name}${suffix}]`;
}

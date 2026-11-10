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

import { z } from "zod";

export const AlertType = {
  SELECTED_AS_HOME_PLAN: "SELECTED_AS_HOME_PLAN",
  NEW_APPLICATION: "NEW_APPLICATION",
  RELEASE_DATE_CHANGED: "RELEASE_DATE_CHANGED",
} as const;

export type AlertType = (typeof AlertType)[keyof typeof AlertType];

/**
 * Days an alert stays visible if never dismissed; null = until dismissed.
 * Evaluated at read time, so changing a value applies to existing rows.
 */
export const ALERT_VISIBLE_DAYS: Record<AlertType, number | null> = {
  SELECTED_AS_HOME_PLAN: 10,
  NEW_APPLICATION: 2,
  RELEASE_DATE_CHANGED: 10,
};

/**
 * The shape of each type's `metadata` snapshot, validated on write and parsed
 * on read; null = the type carries no metadata. Numbers only, never PII. `satisfies` (not an annotation) keeps each schema's own type, which the
 * `VisibleAlert` union below is built from.
 */
export const ALERT_METADATA_SCHEMA = {
  SELECTED_AS_HOME_PLAN: null,
  NEW_APPLICATION: null,
  RELEASE_DATE_CHANGED: z.object({ deltaDays: z.number().int() }).strict(),
} satisfies Record<AlertType, z.ZodTypeAny | null>;

type AlertMetadata<T extends AlertType> =
  (typeof ALERT_METADATA_SCHEMA)[T] extends z.ZodTypeAny
    ? z.infer<(typeof ALERT_METADATA_SCHEMA)[T]>
    : null;

/** A visible alert as the API returns it, discriminated on `type`. */
export type VisibleAlert = {
  [T in AlertType]: { id: string; type: T; metadata: AlertMetadata<T> };
}[AlertType];

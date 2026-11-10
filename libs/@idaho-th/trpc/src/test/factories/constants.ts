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

import { randomUUID } from "node:crypto";

export const TEST_DATES = {
  SENT_TO_PROVIDERS: new Date("2026-06-01T00:00:00.000Z"),
  DOCUMENT_CONFIRMED: new Date("2026-06-02T00:00:00.000Z"),
  // Deliberately stale so a test can prove a write bumped lastActivityAt.
  LAST_ACTIVITY: new Date("2026-06-03T00:00:00.000Z"),
} as const;

export const TEST_STAFF_PSEUDONYMIZED_ID = "staff-1";

export const TEST_PROVIDER_PSEUDONYMIZED_ID = "provider-1";

/**
 * Unique value for columns with a unique constraint. Unguessable on purpose: a
 * test that needs a specific value must pass an explicit override.
 */
export function uniqueId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

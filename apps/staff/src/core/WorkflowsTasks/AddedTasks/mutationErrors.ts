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

import * as Sentry from "@sentry/react";
import toast from "react-hot-toast";

/**
 * Centralized handler for Firestore write failures on the AddedTasks
 * mutations (add / edit / delete / toggle-complete). Surfaces a toast to the
 * user so the failure isn't silent, and reports to Sentry tagged by feature
 * + action so we can spot the failure mode in aggregate.
 */
export function handleMutationFailure(action: string, err: unknown): void {
  Sentry.captureException(err, { tags: { feature: "added_tasks", action } });
  toast(`Couldn’t ${action} task. Please try again.`);
}

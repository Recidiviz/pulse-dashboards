// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

/**
 * See {@link Permission} for documentation of the permissions enumerated here
 */
export const permissionSchema = z.enum([
  "enhanced",
  "live_data",
  "translator",
  "global_write",
]);

/**
 * Permissions that may be assigned to users of the JII app.
 * - enhanced: grants user access to the resident search page. This was the first permission
 * defined in this app and its name is a legacy of not yet knowing what its scope would be
 * - live_data: without this permission, user can only access fixture/demo data
 * - translator: user can access translation features (preview languages before they are enabled,
 * activate Translator Mode to view translation string keys, etc)
 *
 * State-level access permissions are based on the `AuthorizedUserProfile`'s `stateCode` and `allowedStates`.
 * There is an implicit permission for all users that if they have an external ID,
 * they can access any data associated with that ID (i.e., their own data).
 */
export type Permission = z.infer<typeof permissionSchema>;

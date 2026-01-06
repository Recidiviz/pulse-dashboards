// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Permission, permissionSchema } from "~@jii/auth";
import { HydrationState } from "~hydration-utils";

import { stateCodes } from "../../configs/stateConstants";
import { AuthHandler } from "./types";

const permissionsArraySchema = z.array(permissionSchema);

export class OfflineAuthHandler implements AuthHandler {
  get userProfile(): AuthHandler["userProfile"] {
    let permissionsOverride: Array<Permission> | undefined;
    try {
      const storedValue = localStorage.getItem("offlinePermissionsOverride");
      if (storedValue) {
        permissionsOverride = permissionsArraySchema.parse(
          JSON.parse(storedValue),
        );

        // eslint-disable-next-line no-console
        console.log(
          "Offline mode: reading permissions from localStorage.offlinePermissionsOverride",
        );
      }
    } catch {
      console.warn(
        "localStorage.offlinePermissionsOverride contained an invalid value; using default permissions.",
      );
    }

    return {
      stateCode: "RECIDIVIZ",
      allowedStates: [...stateCodes.options],
      permissions: permissionsOverride ?? [...permissionSchema.options],
    };
  }

  async getFirebaseToken() {
    // don't bother with JWT encoding in offline mode, backend will handle this
    return JSON.stringify({
      ...this.userProfile,
      sub: "offline-user",
      app: "jii",
    });
  }

  // everything below this line is a stub because the functionality doesn't really apply to offline mode

  hydrate() {
    return;
  }

  hydrationState: HydrationState = { status: "hydrated" };
}

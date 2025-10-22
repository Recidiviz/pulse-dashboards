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

import { permissionSchema } from "~@jii/auth";
import { HydrationState } from "~hydration-utils";

import { stateCodes } from "../../configs/stateConstants";
import { AuthHandler } from "./types";

export class OfflineAuthHandler implements AuthHandler {
  get userProfile(): AuthHandler["userProfile"] {
    return {
      stateCode: "RECIDIVIZ",
      allowedStates: [...stateCodes.options],
      permissions: [...permissionSchema.options],
    };
  }

  // everything below this line is a stub because the functionality doesn't really apply to offline mode

  async getFirebaseToken() {
    return "offline";
  }

  hydrate() {
    return;
  }

  hydrationState: HydrationState = { status: "hydrated" };
}

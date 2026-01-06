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

import { makeAutoObservable } from "mobx";
import { z } from "zod";

import { AuthorizedUserProfile, permissionSchema } from "~@jii/auth";
import { HydrationState } from "~hydration-utils";

import { stateCodes } from "../../configs/stateConstants";
import { AuthHandler } from "./types";

const offlineUserIds = z.enum(["default", "nonTranslator"]);
export type OfflineUserId = z.infer<typeof offlineUserIds>;

const OFFLINE_USER_ID_KEY = "offline-user-id";

/**
 * Mapping of all available user personas available in offline mode.
 * Useful for exercising various access controls in testing, etc
 */
export const offlineUsers: Record<OfflineUserId, AuthorizedUserProfile> = {
  // this user's access should be totally unrestricted
  default: {
    stateCode: "OFFLINE",
    allowedStates: [...stateCodes.options],
    permissions: [...permissionSchema.options],
  },
  // this user has everything except translator permission
  nonTranslator: {
    stateCode: "OFFLINE",
    allowedStates: [...stateCodes.options],
    permissions: permissionSchema.options.filter((p) => p !== "translator"),
  },
};

export class OfflineAuthHandler implements AuthHandler {
  constructor() {
    makeAutoObservable(this);
    this.updateActiveUserId();
  }

  get userProfile(): AuthHandler["userProfile"] {
    return this.activeUser.profile;
  }

  async getFirebaseToken() {
    // don't bother with JWT encoding in offline mode, backend will handle this
    return JSON.stringify({
      ...this.userProfile,
      sub: `offline-user-${this.activeUserId}`,
      app: "jii",
    });
  }

  private activeUserId: OfflineUserId = "default";

  private updateActiveUserId() {
    try {
      this.activeUserId = offlineUserIds.parse(
        sessionStorage.getItem(OFFLINE_USER_ID_KEY),
      );
    } catch {
      this.activeUserId = "default";
    }
  }

  get activeUser(): { id: OfflineUserId; profile: AuthorizedUserProfile } {
    return { id: this.activeUserId, profile: offlineUsers[this.activeUserId] };
  }

  setActiveUser(id: OfflineUserId) {
    sessionStorage.setItem(OFFLINE_USER_ID_KEY, id);
    this.updateActiveUserId();
  }

  // everything below this line is a stub because the functionality doesn't really apply to offline mode

  hydrate() {
    return;
  }

  hydrationState: HydrationState = { status: "hydrated" };
}

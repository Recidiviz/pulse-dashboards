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

import { boot, shutdown, update } from "@intercom/messenger-js-sdk";

import { isTestEnv } from "~client-env-utils";

/**
 * Intercom maintains its own global state but this class provides
 * some standardized methods for interacting with it. It depends on the
 * `VITE_INTERCOM_APP_ID` environment variable; if a value is not present
 * at construction time, Intercom will remain offline and all methods will be no-ops.
 */
export class IntercomClient {
  private isOffline = true;

  // avoid junking up stdout during tests
  private isSilent = isTestEnv();

  constructor() {
    const appId = import.meta.env["VITE_INTERCOM_APP_ID"];
    if (appId) {
      boot({ app_id: appId, hide_default_launcher: true });
      this.isOffline = false;
    }
  }

  /**
   * Identifies the current user to Intercom.
   */
  updateUser(userArgs: {
    state_code: string;
    user_hash: string;
    user_id: string;
    [key: string]: unknown;
  }): void {
    if (this.isOffline) {
      if (!this.isSilent) {
        console.log(`[Intercom] ${JSON.stringify(userArgs)}`);
      }
      return;
    }

    update(userArgs);
  }

  /**
   * Ends the user's session and clears user data. Especially important to call
   * when user may be using a public computer to ensure private messages don't leak.
   */
  logOut(): void {
    if (this.isOffline) return;
    shutdown();
  }
}

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

import Intercom, { shutdown } from "@intercom/messenger-js-sdk";

/**
 * Intercom maintains its own global state but this class provides
 * some standardized methods for interacting with it. It depends on the
 * `VITE_INTERCOM_APP_ID` environment variable; if a value is not present
 * at construction time, Intercom will remain offline and all methods will be no-ops.
 */
export class IntercomClient {
  private isInitialized = false;

  private isSilent = import.meta.env["VITE_AUTH_ENV"] !== "development";

  /**
   * Initializes an Intercom session for the specified user.
   * Will be a no-op if VITE_INTERCOM_APP_ID is missing from the environment.
   */
  init({
    stateCode,
    intercomToken,
    pseudonymizedId,
    externalId,
  }: {
    stateCode: string;
    intercomToken: string;
    pseudonymizedId: string;
    // optional for type safety reasons but assumed to exist in practice
    externalId?: string;
  }): void {
    // specified per environment; if missing everything in this class is a no-op
    const appId = import.meta.env["VITE_INTERCOM_APP_ID"];

    const userArgs = {
      user_id: pseudonymizedId,
      state_code: stateCode,
      intercom_user_jwt: intercomToken,
      external_id: externalId,
    };
    if (!appId) {
      if (!this.isSilent) {
        // eslint-disable-next-line no-console
        console.log(`[Intercom] ${JSON.stringify(userArgs)}`);
      }
      return;
    }

    // this is safe to call multiple times without error or duplication,
    // in case that happens for some reason; not currently expected in practice
    Intercom({ app_id: appId, hide_default_launcher: true, ...userArgs });
    this.isInitialized = true;
  }

  /**
   * Ends the user's session and clears user data.
   */
  logOut(): void {
    if (!this.isInitialized) return;
    shutdown();
  }
}

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

import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  connectAuthEmulator,
  getAuth,
  getIdToken,
  signInWithCustomToken,
} from "firebase/auth";

export class FirebaseAuthClient {
  constructor(
    public projectId: string,
    private apiKey: string,
    private proxyHost?: string,
  ) {}

  get app(): FirebaseApp {
    return (
      getApps()[0] ??
      initializeApp({ projectId: this.projectId, apiKey: this.apiKey })
    );
  }

  get auth(): Auth {
    return getAuth(this.app);
  }

  /**
   * Signs into Firebase with a custom token
   * @param firebaseToken the custom token, obtained from the backend of your current app
   * @param emulatorUrl pass this to connect Firebase to a local emulator instead of the live service
   */
  async authenticate(firebaseToken: string, emulatorUrl?: string) {
    const { auth } = this;
    if (this.proxyHost) {
      // there seems to be no documented API for changing this config,
      // but editing it directly works! Only making the overrides necessary
      // to support custom token logins, not every possible API call
      auth.config.apiHost = `${this.proxyHost}/gcp-identitytoolkit`;
      auth.config.tokenApiHost = `${this.proxyHost}/gcp-securetoken`;
    }
    if (emulatorUrl) {
      connectAuthEmulator(auth, emulatorUrl);
    }
    await signInWithCustomToken(auth, firebaseToken);
  }

  /**
   * ID Tokens are the auth tokens you include with API requests that use Firebase Auth.
   * This method requests a fresh one for use with an API call
   */
  async getIdToken() {
    const { currentUser } = this.auth;
    if (!currentUser)
      throw new Error("Cannot get API token before authenticating");
    return getIdToken(currentUser);
  }
}

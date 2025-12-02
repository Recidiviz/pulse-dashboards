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

import { FirebaseApp, initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";

export class FirebaseStore {
  app: FirebaseApp;

  constructor(
    projectId: string,
    apiKey: string,
    private proxyHost?: string,
  ) {
    this.app = initializeApp({ projectId, apiKey });
  }

  get auth() {
    return getAuth(this.app);
  }

  async authenticate(firebaseToken: string) {
    const auth = this.auth;
    if (this.proxyHost) {
      // there seems to be no documented API for changing this config,
      // but editing it directly works! Only making the overrides necessary
      // to support custom token logins, not every possible API call
      auth.config.apiHost = `${this.proxyHost}/gcp-identitytoolkit`;
      auth.config.tokenApiHost = `${this.proxyHost}/gcp-securetoken`;
    }
    await signInWithCustomToken(auth, firebaseToken);
  }
}

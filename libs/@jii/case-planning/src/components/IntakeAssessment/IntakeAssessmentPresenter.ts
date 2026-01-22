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

import { FirebaseStore, UserStore } from "~@jii/data";
import { getUserFacingErrorMessage } from "~@reentry/frontend-shared";
import { ResidentRecord } from "~datatypes";
import { Hydratable, HydrationState } from "~hydration-utils";

import {
  REENTRY_BACKEND_PATH,
  REENTRY_DEV_BACKEND_PATH,
} from "../../constants";

export class IntakeAssessmentPresenter implements Hydratable {
  authToken: string | null = null;
  userFacingErrorMessage: string | null = null;
  private hasAttemptedBackendVerification = false;

  constructor(
    private readonly firebaseStore: FirebaseStore,
    private readonly userStore: UserStore,
    private readonly resident: ResidentRecord,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.updateAuthToken();
  }

  async hydrate() {
    try {
      const firebaseIdToken = await this.firebaseStore.getIdToken();

      if (!firebaseIdToken) {
        throw new Error(
          "Expected Firebase ID token to be hydrated, but it was empty",
        );
      }

      const response = await fetch(
        `${window.location.origin}${this.userStore.hasPermission("live_data") ? REENTRY_BACKEND_PATH : REENTRY_DEV_BACKEND_PATH}/external/client/verify/firebase-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firebase_token: firebaseIdToken,
            client_pseudo_id: this.resident.pseudonymizedId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        const error = new Error("Backend verification failed");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).detail = data.detail;
        throw error;
      }
      if (data?.access_token && data?.client_pseudo_id) {
        sessionStorage.setItem("intake_token", data.access_token);
        this.updateAuthToken();
      } else {
        this.userFacingErrorMessage =
          "Invalid response from server. Please try again.";
        return;
      }
    } catch (err: unknown) {
      console.error("Error verifying:", err);
      this.userFacingErrorMessage = getUserFacingErrorMessage(err);
    } finally {
      this.hasAttemptedBackendVerification = true;
    }
  }

  get hydrationState(): HydrationState {
    if (!this.hasAttemptedBackendVerification) {
      return { status: "needs hydration" };
    } else {
      if (this.userFacingErrorMessage) {
        return {
          status: "failed",
          error: new Error(this.userFacingErrorMessage),
        };
      }

      return { status: "hydrated" };
    }
  }

  // retrieves the token from session storage to make it observable by Mobx
  updateAuthToken() {
    this.authToken = sessionStorage.getItem("intake_token");
  }

  get isAuthorized() {
    return !!this.authToken;
  }
}

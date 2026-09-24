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

import { Analytics } from "@segment/analytics-node";
import { captureException } from "@sentry/node";
import { randomUUID } from "crypto";

type EventName =
  `backend_${"edovo_login_succeeded" | "edovo_login_denied" | "edovo_login_internal_error"}`;

export class SegmentClient {
  private analytics?: Analytics;

  constructor() {
    const writeKey = process.env["SEGMENT_WRITE_KEY"];

    if (writeKey) {
      this.analytics = new Analytics({ writeKey });
      this.analytics.on("error", (e) => captureException(e));
    } else if (process.env["SENTRY_ENV"] !== "development") {
      captureException("SEGMENT_WRITE_KEY missing from environment");
    }
  }

  /**
   * Shared by track() and trackAnonymousEvent(): sends if configured and not
   * suppressed, otherwise logs what would have been sent. Recidiviz-internal users
   * are suppressed everywhere except staging (mirroring the frontend SegmentClient's
   * policy) - harmless for track(), since Recidiviz users can't reach the Edovo login
   * flow it's used for, but now load-bearing for trackAnonymousEvent().
   */
  private send(
    payload: {
      event: string;
      anonymousId: string;
      userId?: string;
      properties: Record<string, unknown>;
    },
    isRecidivizUser: boolean,
  ): void {
    const suppress = isRecidivizUser && process.env["DEPLOY_ENV"] !== "staging";

    if (this.analytics && !suppress) {
      this.analytics.track(payload);
    } else {
      console.log(
        `[Analytics] Tracking ${payload.event} (anonymousId: ${payload.anonymousId}) with data ${JSON.stringify(payload.properties)}`,
      );
    }
  }

  track(
    event: EventName,
    properties: {
      isRecidiviz: boolean;
      stateCode?: string;
      encryptedEdovoToken?: string;
      pseudonymizedId?: string;
      isDemoUser?: boolean;
    },
  ): void {
    const anonymousId = properties.encryptedEdovoToken ?? randomUUID();

    this.send(
      { event, anonymousId, userId: properties.pseudonymizedId, properties },
      properties.isRecidiviz,
    );
  }

  /**
   * For events that must never carry a userId or a derived anonymousId - only the
   * explicit anonymousId passed in. isRecidivizUser is stamped onto the tracked
   * properties here, not left to the caller, so it's a failsafe against a future
   * caller forgetting it, not just a suppression-check input.
   */
  trackAnonymousEvent(
    event: string,
    anonymousId: string,
    properties: Record<string, unknown>,
    options: { isRecidivizUser: boolean },
  ): void {
    this.send(
      {
        event,
        anonymousId,
        properties: { ...properties, isRecidivizUser: options.isRecidivizUser },
      },
      options.isRecidivizUser,
    );
  }

  async flush(): Promise<void> {
    return this.analytics?.flush();
  }
}

// a single global instance should be fine, no need to keep reinitializing the SDK
export const segment = new SegmentClient();

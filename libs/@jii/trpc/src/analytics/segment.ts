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

class SegmentClient {
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
    if (this.analytics) {
      const anonymousId = properties.encryptedEdovoToken ?? randomUUID();

      this.analytics.track({
        event,
        anonymousId,
        userId: properties.pseudonymizedId,
        properties,
      });
    } else {
      console.log(
        `[Analytics] Tracking ${event} with data ${JSON.stringify(properties)}`,
      );
    }
  }

  async flush(): Promise<void> {
    return this.analytics?.flush();
  }
}

// a single global instance should be fine, no need to keep reinitializing the SDK
export const segment = new SegmentClient();

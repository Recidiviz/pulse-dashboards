// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { v4 as uuidv4 } from "uuid";

import { OpportunityType } from "./firestore";
import { OpportunityStatus } from "./PracticesStore/Client";

const sessionId = uuidv4();

const isAnalyticsEnabled = process.env.NODE_ENV !== "development";

export function identify(userId: string): void {
  const traits = { sessionId };

  if (isAnalyticsEnabled) {
    window.analytics.identify(userId, traits);
  } else {
    // eslint-disable-next-line no-console
    console.log(
      `[Analytics] Identifying user: ${userId}, with traits: ${JSON.stringify(
        traits
      )}`
    );
  }
}

const track = (eventName: string, metadata?: Record<string, unknown>): void => {
  const fullMetadata = metadata || {};
  fullMetadata.sessionId = sessionId;

  if (isAnalyticsEnabled) {
    window.analytics.track(eventName, fullMetadata);
  } else {
    // eslint-disable-next-line
    console.log(
      `[Analytics] Tracking event name: ${eventName}, with metadata: ${JSON.stringify(
        fullMetadata
      )}`
    );
  }
};

type ClientFormTrackingMetadata = {
  clientId: string;
  opportunityType: OpportunityType;
};

export function trackReferralFormViewed(
  metadata: ClientFormTrackingMetadata
): void {
  track("frontend.referral_form_viewed", metadata);
}

export const trackReferralFormPrinted = (
  metadata: ClientFormTrackingMetadata
): void => {
  track("frontend.referral_form_printed", metadata);
};

export function trackSurfacedInList(
  metadata: ClientFormTrackingMetadata
): void {
  track("frontend.surfaced_in_list", metadata);
}

export function trackSetOpportunityStatus<
  Metadata extends { clientId: string; status: OpportunityStatus }
>(metadata: Metadata): void {
  track("frontend.opportunity_status_updated", metadata);
}

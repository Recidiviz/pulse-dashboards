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
// TODO(#2518): Investigate if this is necessary
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="window.d.ts"/>

import { v4 as uuidv4 } from "uuid";

import { OpportunityStatus, OpportunityType } from "./WorkflowsStore";

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

type ClientOpportunityTrackingMetadata = {
  clientId: string;
  opportunityType: OpportunityType;
};

export function trackReferralFormViewed(
  metadata: ClientOpportunityTrackingMetadata
): void {
  track("frontend.referral_form_viewed", metadata);
}

export function trackReferralFormFirstEdited(
  metadata: ClientOpportunityTrackingMetadata
): void {
  track("frontend.referral_form_first_edited", metadata);
}

export const trackReferralFormPrinted = (
  metadata: ClientOpportunityTrackingMetadata
): void => {
  track("frontend.referral_form_printed", metadata);
};

export function trackSurfacedInList(
  metadata: ClientOpportunityTrackingMetadata
): void {
  track("frontend.surfaced_in_list", metadata);
}

export function trackSetOpportunityStatus<
  Metadata extends ClientOpportunityTrackingMetadata & {
    status: OpportunityStatus;
  }
>(metadata: Metadata): void {
  track("frontend.opportunity_status_updated", metadata);
}

export function trackClientProfileViewed(metadata: { clientId: string }): void {
  track("frontend.profile_viewed", metadata);
}

export function trackProfileOpportunityClicked(
  metadata: ClientOpportunityTrackingMetadata
): void {
  track("frontend.profile_opportunity_link_clicked", metadata);
}

export function trackCaseloadSearch(metadata: {
  officerCount: number;
  isDefault: boolean;
}): void {
  track("frontend.caseload_search", metadata);
}

export function trackOpportunityPreviewed(
  metadata: ClientOpportunityTrackingMetadata
): void {
  track("frontend.opportunity_previewed", metadata);
}

export function trackOpportunityMarkedEligible(
  metadata: ClientOpportunityTrackingMetadata
): void {
  track("frontend.opportunity_marked_eligible", metadata);
}

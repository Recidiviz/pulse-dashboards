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

import { some } from "lodash";
import { rgba } from "polished";
import { NavigateFunction } from "react-router-dom";

import { palette } from "~design-system";

import { type Opportunity } from "../../WorkflowsStore";
import { OTHER_KEY } from "../../WorkflowsStore/utils";
import { INSIGHTS_PATHS, insightsUrl, workflowsUrl } from "../views";

export const OPPORTUNITY_STATUS_COLORS = {
  eligible: {
    icon: palette.signal.highlight,
    iconAlmost: palette.data.gold1,
    iconIneligible: palette.signal.error,
    background: "transparent",
    border: rgba(palette.slate20, 0.2),
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.signal.links,
    palette: "GREEN",
  },
  almostEligible: {
    icon: palette.signal.highlight,
    iconAlmost: palette.data.gold1,
    iconIneligible: palette.signal.error,
    background: "transparent",
    border: rgba(palette.slate20, 0.2),
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.data.gold1,
    palette: "YELLOW",
  },
  ineligible: {
    icon: palette.signal.highlight,
    iconAlmost: palette.data.gold1,
    iconIneligible: palette.signal.error,
    background: "transparent",
    border: rgba(palette.slate20, 0.2),
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.signal.error,
    palette: "RED",
  },
  denied: {
    icon: palette.signal.highlight,
    iconAlmost: palette.data.gold1,
    iconIneligible: palette.signal.error,
    background: "transparent",
    border: rgba(palette.slate20, 0.2),
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.signal.error,
    palette: "RED",
  },
  submitted: {
    icon: palette.signal.highlight,
    iconAlmost: palette.data.gold1,
    iconIneligible: palette.signal.error,
    background: "transparent",
    border: rgba(palette.slate20, 0.2),
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.data.gold1,
    palette: "BLUE",
  },
  pendingOverdue: {
    icon: palette.signal.error,
    iconAlmost: palette.data.gold1,
    iconIneligible: palette.signal.error,
    background: "transparent",
    border: rgba(palette.slate20, 0.2),
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.signal.error,
    badgeBackground: "rgb(255,244,249)",
    badgeBorder: "rgb(255,204,223)",
    badgeText: "rgb(179,9,60)",
    palette: "RED",
  },
  alert: {
    icon: palette.signal.error,
    iconAlmost: palette.signal.error,
    iconIneligible: palette.signal.error,
    background: "transparent",
    border: rgba(palette.slate20, 0.2),
    text: palette.signal.error,
    buttonFill: palette.data.gold1,
    link: palette.data.gold1,
    palette: "RED",
  },
  alertOverride: {
    icon: rgba(palette.slate, 0.4),
    iconAlmost: rgba(palette.slate, 0.4),
    iconIneligible: palette.signal.error,
    background: "transparent",
    border: rgba(palette.slate20, 0.2),
    text: palette.slate85,
    buttonFill: palette.signal.links,
    link: palette.pine1,
    palette: "RED",
  },
  eligibleOverride: {
    icon: palette.signal.highlight,
    iconAlmost: palette.signal.error,
    iconIneligible: palette.signal.error,
    background: "transparent",
    border: rgba(palette.slate20, 0.2),
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.signal.links,
    palette: "RED",
  },
} as const;

export type StatusPalette =
  (typeof OPPORTUNITY_STATUS_COLORS)[keyof typeof OPPORTUNITY_STATUS_COLORS];

export function useStatusColors({
  config: { isAlert },
  isSubmitted,
  isPendingOverdue,
  denial,
  almostEligible,
  customStatusPalette,
  isIneligible,
  reviewStatus,
}: Opportunity): StatusPalette {
  if (customStatusPalette) return customStatusPalette;

  switch (reviewStatus) {
    case "SUBMITTED":
      if (isPendingOverdue) {
        return OPPORTUNITY_STATUS_COLORS.pendingOverdue;
      }
      return OPPORTUNITY_STATUS_COLORS.submitted;
    case "DENIED":
      return isAlert
        ? OPPORTUNITY_STATUS_COLORS.alertOverride
        : OPPORTUNITY_STATUS_COLORS.denied;
    case "ALMOST":
      return OPPORTUNITY_STATUS_COLORS.almostEligible;
  }

  if (isIneligible) return OPPORTUNITY_STATUS_COLORS.ineligible;

  return isAlert
    ? OPPORTUNITY_STATUS_COLORS.alert
    : OPPORTUNITY_STATUS_COLORS.eligible;
}

export function reasonsIncludesOtherKey(reasons?: string[]) {
  return reasonsIncludesKey(OTHER_KEY, reasons);
}

export function reasonsIncludesKey(key: string, reasons?: string[]) {
  return some(reasons, (reason) =>
    reason.toUpperCase().includes(key.toUpperCase()),
  );
}

/**
 * Resolves the Insights URL to return to after leaving an opportunity form
 * (via the Back button or after submitting/forwarding it), if the form was
 * reached from an Insights page. Returns undefined otherwise, so callers can
 * fall back to their own (Workflows or browser-history) navigation.
 */
export function getInsightsOpportunityUrl({
  pathname,
  urlSection,
  officerPseudoId,
  supervisorPseudoId,
}: {
  pathname: string;
  urlSection: string | undefined;
  officerPseudoId: string | undefined;
  supervisorPseudoId: string | undefined;
}): string | undefined {
  if (!urlSection || !pathname.startsWith(INSIGHTS_PATHS.supervision)) {
    return undefined;
  }

  if (officerPseudoId) {
    return insightsUrl("supervisionOpportunity", {
      officerPseudoId,
      opportunityTypeUrl: urlSection,
    });
  }

  if (supervisorPseudoId) {
    return insightsUrl("supervisionSupervisorOpportunity", {
      supervisorPseudoId,
      opportunityTypeUrl: urlSection,
    });
  }

  return undefined;
}

/**
 * Navigates back from an opportunity form (via the Back button or after
 * submitting/forwarding it) to the Insights page it was reached from, if any;
 * otherwise falls back to in-app history or the opportunity's caseload page.
 */
export function navigateBackFromOpportunityForm({
  navigate,
  pathname,
  urlSection,
  officerPseudoId,
  supervisorPseudoId,
  locationKey,
}: {
  navigate: NavigateFunction;
  pathname: string;
  urlSection: string | undefined;
  officerPseudoId: string | undefined;
  supervisorPseudoId: string | undefined;
  locationKey: string;
}): void {
  const insightsDestination = getInsightsOpportunityUrl({
    pathname,
    urlSection,
    officerPseudoId,
    supervisorPseudoId,
  });

  if (insightsDestination) {
    navigate(insightsDestination);
  } else if (urlSection && locationKey === "default") {
    navigate(workflowsUrl("opportunityClients", { urlSection }));
  } else {
    // Prefer navigate(-1) over passing previousPage through link state so
    // that any new entry point to this form works correctly without needing
    // to remember to thread the state key through.
    // location.key is 'default' only on a fresh deep link; any other value
    // means React Router pushed this entry, so navigate(-1) stays in-app.
    navigate(-1);
  }
}

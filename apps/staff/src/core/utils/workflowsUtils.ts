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

import { palette } from "~design-system";

import { type Opportunity } from "../../WorkflowsStore";
import { OTHER_KEY } from "../../WorkflowsStore/utils";

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

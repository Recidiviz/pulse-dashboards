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

import { palette } from "@recidiviz/design-system";
import { rgba } from "polished";

import { type Opportunity } from "../../WorkflowsStore";

export const OPPORTUNITY_STATUS_COLORS = {
  eligible: {
    icon: palette.signal.highlight,
    iconAlmost: palette.data.gold1,
    background: "rgb(247,251,249)",
    border: "rgb(234,246,241)",
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.signal.links,
    badgeBackground: "rgb(239,255,229)",
    badgeBorder: "rgb(166,235,132)",
    badgeText: "rgb(0,105,8)",
  },
  almostEligible: {
    icon: palette.signal.highlight,
    iconAlmost: palette.data.gold1,
    background: "transparent",
    border: rgba(palette.slate, 0.1),
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.data.gold1,
    badgeBackground: "rgb(255,248,222)",
    badgeBorder: "rgb(252,213,121)",
    badgeText: "rgb(168,44,0)",
  },
  ineligible: {
    icon: palette.signal.highlight,
    iconAlmost: palette.data.gold1,
    background: "transparent",
    border: rgba(palette.slate, 0.1),
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.signal.error,
    badgeBackground: "rgb(255,244,249)",
    badgeBorder: "rgb(255,204,223)",
    badgeText: "rgb(179,9,60)",
  },
  submitted: {
    icon: palette.signal.highlight,
    iconAlmost: palette.data.gold1,
    background: "transparent",
    border: rgba(palette.slate, 0.1),
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.data.gold1,
    badgeBackground: "rgb(239,243,255)",
    badgeBorder: "rgb(162,179,239)",
    badgeText: "rgb(0,56,124)",
  },
  alert: {
    icon: palette.signal.error,
    iconAlmost: palette.signal.error,
    background: rgba(palette.signal.error, 0.05),
    border: rgba(palette.slate, 0.1),
    text: palette.signal.error,
    buttonFill: palette.data.gold1,
    link: palette.data.gold1,
    badgeBackground: "rgb(255,244,249)",
    badgeBorder: "rgb(255,204,223)",
    badgeText: "rgb(179,9,60)",
  },
  alertOverride: {
    icon: rgba(palette.slate, 0.4),
    iconAlmost: rgba(palette.slate, 0.4),
    background: "transparent",
    border: rgba(palette.slate, 0.1),
    text: palette.slate85,
    buttonFill: palette.signal.links,
    link: palette.pine1,
    badgeBackground: "rgb(255,244,249)",
    badgeBorder: "rgb(255,204,223)",
    badgeText: "rgb(179,9,60)",
  },
} as const;

export type StatusPalette =
  (typeof OPPORTUNITY_STATUS_COLORS)[keyof typeof OPPORTUNITY_STATUS_COLORS];

export function useStatusColors({
  config: { isAlert },
  reviewStatus,
  almostEligible,
}: Opportunity): StatusPalette {
  if (reviewStatus === "SUBMITTED") return OPPORTUNITY_STATUS_COLORS.submitted;

  if (isAlert) {
    if (reviewStatus === "DENIED") {
      return OPPORTUNITY_STATUS_COLORS.alertOverride;
    }
    if (almostEligible) {
      return OPPORTUNITY_STATUS_COLORS.almostEligible;
    }
    return OPPORTUNITY_STATUS_COLORS.alert;
  }

  if (reviewStatus === "DENIED") {
    return OPPORTUNITY_STATUS_COLORS.ineligible;
  }

  if (almostEligible) {
    return OPPORTUNITY_STATUS_COLORS.almostEligible;
  }

  return OPPORTUNITY_STATUS_COLORS.eligible;
}

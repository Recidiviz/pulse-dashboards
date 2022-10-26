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

import { palette } from "@recidiviz/design-system";
import { rgba } from "polished";

import type { Opportunity } from "../../WorkflowsStore";

export const OPPORTUNITY_STATUS_COLORS = {
  eligible: {
    icon: palette.signal.highlight,
    iconAlmost: palette.data.gold1,
    background: rgba(palette.signal.highlight, 0.1),
    border: rgba(palette.signal.highlight, 0.3),
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.signal.links,
  },
  almostEligible: {
    icon: palette.signal.highlight,
    iconAlmost: palette.data.gold1,
    background: "transparent",
    border: rgba(palette.slate, 0.1),
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.data.gold1,
  },
  ineligible: {
    icon: palette.signal.highlight,
    iconAlmost: palette.data.gold1,
    background: "transparent",
    border: rgba(palette.slate, 0.1),
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.signal.error,
  },
  alert: {
    icon: palette.signal.error,
    iconAlmost: palette.signal.error,
    background: rgba(palette.signal.error, 0.05),
    border: rgba(palette.slate, 0.1),
    text: palette.signal.error,
    buttonFill: palette.data.gold1,
    link: palette.data.gold1,
  },
  alertOverride: {
    icon: rgba(palette.slate, 0.4),
    iconAlmost: rgba(palette.slate, 0.4),
    background: "transparent",
    border: rgba(palette.slate, 0.1),
    text: palette.slate85,
    buttonFill: palette.signal.links,
    link: palette.pine1,
  },
} as const;

export type StatusPalette = typeof OPPORTUNITY_STATUS_COLORS[keyof typeof OPPORTUNITY_STATUS_COLORS];

export function useStatusColors(opportunity: Opportunity): StatusPalette {
  if (opportunity.isAlert) {
    if (opportunity?.reviewStatus === "DENIED") {
      return OPPORTUNITY_STATUS_COLORS.alertOverride;
    }
    return OPPORTUNITY_STATUS_COLORS.alert;
  }

  if (opportunity?.reviewStatus === "DENIED") {
    return OPPORTUNITY_STATUS_COLORS.ineligible;
  }

  if (opportunity?.almostEligible) {
    return OPPORTUNITY_STATUS_COLORS.almostEligible;
  }
  return OPPORTUNITY_STATUS_COLORS.eligible;
}

/**
 * Alert-type opportunities only have a visible status if they're denied; others are always visible
 */
export function useShowEligibilityStatus(opportunity: Opportunity): boolean {
  return !opportunity.isAlert || opportunity.reviewStatus === "DENIED";
}

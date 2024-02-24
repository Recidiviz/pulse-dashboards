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
    background: "rgb(247,251,249)",
    border: "rgb(234,246,241)",
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

export type StatusPalette =
  typeof OPPORTUNITY_STATUS_COLORS[keyof typeof OPPORTUNITY_STATUS_COLORS];

export function useStatusColors({
  isAlert,
  reviewStatus,
  almostEligible,
}: Opportunity): StatusPalette {
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

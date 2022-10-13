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

import { Icon, palette, TooltipTrigger } from "@recidiviz/design-system";
import { rgba } from "polished";
import React from "react";
import styled from "styled-components/macro";

import type { Opportunity } from "../../WorkflowsStore";

export const STATUS_COLORS = {
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
} as const;

export type StatusPalette = typeof STATUS_COLORS[keyof typeof STATUS_COLORS];

export function useStatusColors(opportunity: Opportunity): StatusPalette {
  // TODO: do this more generically once the "alert" flavor of opportunity stabilizes
  if (opportunity.type === "pastFTRD") return STATUS_COLORS.alert;

  if (opportunity?.reviewStatus === "DENIED") {
    return STATUS_COLORS.ineligible;
  }
  if (opportunity?.almostEligible) {
    return STATUS_COLORS.almostEligible;
  }
  return STATUS_COLORS.eligible;
}

export const InfoTooltipWrapper = styled(TooltipTrigger)`
  vertical-align: text-bottom;
`;

export const Separator = styled.span`
  color: ${palette.slate30};
`;

const InfoLink = styled.a`
  color: ${palette.slate30};

  &:hover,
  &:focus {
    color: ${palette.slate60};
  }
`;

export const InfoButton = ({
  infoUrl,
}: {
  infoUrl: string | undefined;
}): React.ReactElement => (
  <InfoLink href={infoUrl} target="_blank" rel="noreferrer">
    <Icon kind="Info" size={12} />
  </InfoLink>
);

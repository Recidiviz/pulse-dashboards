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

import { Button, palette, Sans14, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { darken, rem, rgba } from "polished";
import React from "react";
import styled from "styled-components/macro";

import type { Client, OpportunityType } from "../../WorkflowsStore";

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
    border: rgba(palette.slate, 0.15),
    text: palette.pine4,
    buttonFill: palette.signal.links,
    link: palette.signal.links,
  },
  ineligible: {
    icon: palette.data.gold1,
    iconAlmost: palette.data.gold1,
    background: rgba(palette.data.gold1, 0.1),
    border: rgba(palette.data.gold1, 0.5),
    text: palette.slate85,
    buttonFill: palette.data.gold1,
    link: palette.data.gold1,
  },
} as const;

export type StatusPalette = typeof STATUS_COLORS[keyof typeof STATUS_COLORS];

export function useStatusColors(client: Client): StatusPalette {
  if (client.opportunities.compliantReporting?.reviewStatus === "DENIED") {
    return STATUS_COLORS.ineligible;
  }
  if (client.opportunities.compliantReporting?.almostEligible) {
    return STATUS_COLORS.almostEligible;
  }
  return STATUS_COLORS.eligible;
}

export const Wrapper = styled.div<{ background: string; border: string }>`
  background-color: ${({ background: backgroundColor }) => backgroundColor};
  border-color: ${({ border: borderColor }) => borderColor};
  border-style: solid;
  border-width: 1px 0;
  color: ${palette.pine1};
  margin: 0 -${rem(spacing.md)};
  padding: ${rem(spacing.md)};
`;

export const ActionButtons = styled.div`
  display: flex;
`;

export const PrintButton = styled(Button)<{ buttonFill: string }>`
  background: ${(props) => props.buttonFill};
  margin-right: ${rem(spacing.sm)};

  &:hover,
  &:focus {
    background: ${(props) => darken(0.1, props.buttonFill)};
  }
`;

const TitleText = styled(Sans14)`
  color: ${palette.pine1};
`;

type TitleProps = {
  titleText: string;
  statusMessage: string;
};

export const Title = observer(({ titleText, statusMessage }: TitleProps) => {
  return (
    <TitleText>
      {`${titleText}: `}
      {statusMessage}
    </TitleText>
  );
});

export const getPrintText = (
  client: Client,
  opportunityType: OpportunityType
): string => {
  if (client.formIsPrinting) {
    return "Printing PDF...";
  }

  if (client.opportunityUpdates?.[opportunityType]?.completed) {
    return "Reprint PDF";
  }

  return "Print PDF";
};

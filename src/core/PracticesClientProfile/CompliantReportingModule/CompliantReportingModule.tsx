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

import {
  Button,
  Icon,
  IconSVG,
  palette,
  spacing,
  TooltipTrigger,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { darken, rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import type { Client } from "../../../PracticesStore/Client";
import { ClientProfileProps } from "../types";
import { CompliantReportingDenial } from "./CompliantReportingDenial";
import { getEligibilityCriteria } from "./eligibilityCriteria";
import { useStatusColors } from "./utils";

const Wrapper = styled.div<{ background: string; border: string }>`
  background-color: ${({ background: backgroundColor }) => backgroundColor};
  border-color: ${({ border: borderColor }) => borderColor};
  border-style: solid;
  border-width: 1px 0;
  color: ${palette.pine1};
  margin: 0 -${rem(spacing.md)};
  padding: ${rem(spacing.md)};
`;

const CriterionIcon = styled(Icon)`
  grid-column: 1;
  /* slight vertical offset to approximate baseline alignment */
  margin-top: ${rem(1)};
`;

const CriterionContent = styled.div`
  grid-column: 2;
`;

const CriteriaList = styled.ul`
  list-style: none;
  font-size: ${rem(14)};
  margin: ${rem(spacing.md)} 0;
  padding: 0;
`;

const Criterion = styled.li`
  display: grid;
  grid-template-columns: ${rem(spacing.lg)} 1fr;
  margin: 0 0 8px;
  line-height: 1.3;
`;

const ActionButtons = styled.div`
  display: flex;
`;

const PrintButton = styled(Button)<{ buttonFill: string }>`
  background: ${(props) => props.buttonFill};
  margin-right: ${rem(spacing.sm)};

  &:hover,
  &:focus {
    background: ${(props) => darken(0.1, props.buttonFill)};
  }
`;

const KeepTogether = styled.span`
  white-space: nowrap;
`;

const InfoTooltipWrapper = styled(TooltipTrigger)`
  vertical-align: text-bottom;
`;

const InfoButton = styled(Button).attrs({
  kind: "link",
  icon: "Info",
  iconSize: 12,
})`
  color: ${palette.slate30};
`;

const Title = observer(({ client }: ClientProfileProps) => {
  return (
    <div>Compliant Reporting: {client.reviewStatus.compliantReporting}</div>
  );
});

const getPrintText = (client: Client) => {
  if (client.formIsPrinting) {
    return "Printing PDF...";
  }

  if (client.updates?.compliantReporting?.completed) {
    return "Reprint PDF";
  }

  return "Print PDF";
};

export const CompliantReportingModule = observer(
  ({ client }: ClientProfileProps) => {
    if (!client.compliantReportingEligible) return null;

    const colors = useStatusColors(client);

    return (
      <Wrapper {...colors}>
        <Title client={client} />
        <CriteriaList style={{ color: colors.text }}>
          {getEligibilityCriteria(client).map(({ text, tooltip }) => {
            // split text so we can prevent orphaned tooltips
            const textTokens = text.split(" ");
            return (
              <Criterion>
                <CriterionIcon
                  kind={IconSVG.Success}
                  color={colors.icon}
                  size={16}
                />
                <CriterionContent>
                  {textTokens.slice(0, -1).join(" ")}{" "}
                  <KeepTogether>
                    {textTokens.slice(-1)}{" "}
                    {tooltip && (
                      <InfoTooltipWrapper contents={tooltip} maxWidth={340}>
                        <InfoButton />
                      </InfoTooltipWrapper>
                    )}
                  </KeepTogether>
                </CriterionContent>
              </Criterion>
            );
          })}
        </CriteriaList>
        <ActionButtons>
          <div>
            <PrintButton
              kind="primary"
              shape="block"
              buttonFill={colors.buttonFill}
              onClick={() => client.printCompliantReportingReferralForm()}
            >
              {getPrintText(client)}
            </PrintButton>
          </div>
          <CompliantReportingDenial client={client} />
        </ActionButtons>
      </Wrapper>
    );
  }
);

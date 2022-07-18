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

import { Button, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { darken, rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import type { Client } from "../../../PracticesStore/Client";
import { ClientProfileProps } from "../types";
import { Title, useStatusColors, Wrapper } from "./common";
import { CompliantReportingDenial } from "./CompliantReportingDenial";
import { CriteriaList } from "./CriteriaList";

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
    if (!client.opportunitiesEligible.compliantReporting) return null;

    const colors = useStatusColors(client);

    return (
      <Wrapper {...colors}>
        <Title client={client} />
        <CriteriaList client={client} colors={colors} />
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

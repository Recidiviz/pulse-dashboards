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

import { observer } from "mobx-react-lite";
import React from "react";

import type { Client } from "../../../WorkflowsStore";
import {
  ActionButtons,
  PrintButton,
  Title,
  useStatusColors,
  Wrapper,
} from "../common";
import { CriteriaList } from "../CriteriaList";
import { ClientProfileProps } from "../types";
import { CompliantReportingDenial } from "./CompliantReportingDenial";

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
    if (!client.opportunities.compliantReporting) return null;

    const colors = useStatusColors(client);

    return (
      <Wrapper {...colors}>
        <Title
          titleText="Compliant Reporting"
          statusMessage={
            client.opportunities.compliantReporting?.statusMessageShort
          }
        />
        <CriteriaList
          opportunity={client.opportunities.compliantReporting}
          colors={colors}
        />
        <ActionButtons>
          <div>
            <PrintButton
              kind="primary"
              shape="block"
              buttonFill={colors.buttonFill}
              onClick={() => client.printReferralForm("compliantReporting")}
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
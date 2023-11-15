// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import React from "react";

import { formatAsCurrency, formatWorkflowsDate } from "../../../utils";
import {
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../styles";
import { ClientProfileProps } from "../types";

export function FinesAndFees({
  client,
}: ClientProfileProps): React.ReactElement {
  return (
    <DetailsSection>
      <DetailsHeading>Fines and Fees</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          <DetailsSubheading>Remaining for current sentence</DetailsSubheading>
          <SecureDetailsContent>
            {client.currentBalance !== undefined &&
              formatAsCurrency(client.currentBalance)}
          </SecureDetailsContent>

          {client.lastPaymentAmount && client.lastPaymentDate ? (
            <>
              <DetailsSubheading>Last Payment</DetailsSubheading>
              <SecureDetailsContent>
                {formatAsCurrency(client.lastPaymentAmount)},{" "}
                {formatWorkflowsDate(client.lastPaymentDate)}
              </SecureDetailsContent>
            </>
          ) : null}
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
}

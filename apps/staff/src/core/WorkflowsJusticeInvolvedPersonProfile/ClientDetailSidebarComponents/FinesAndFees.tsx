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

import { observer } from "mobx-react-lite";
import React from "react";

import { useFeatureVariants } from "../../../components/StoreProvider";
import { formatAsCurrency, formatWorkflowsDate } from "../../../utils";
import { WorkflowsBadgePill } from "../../BadgePill/BadgePill";
import {
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../styles";
import { ClientProfileProps } from "../types";

// TN fines and fees data is unavailable during the TOMIS 2.0 cutover, so
// usTnHideFinesAndFees keeps the section but replaces the values with a pill.
export const FinesAndFees = observer(function FinesAndFees({
  client,
}: ClientProfileProps): React.ReactElement<any> {
  const { usTnHideFinesAndFees } = useFeatureVariants();

  if (usTnHideFinesAndFees) {
    return (
      <DetailsSection>
        <DetailsHeading>Fines and Fees</DetailsHeading>
        <WorkflowsBadgePill text="Temporarily unavailable" palette="SLATE" />
      </DetailsSection>
    );
  }

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
});

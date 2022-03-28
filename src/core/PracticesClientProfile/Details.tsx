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

import { palette, spacing } from "@recidiviz/design-system";
import { format } from "date-fns";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { UNKNOWN } from "../../PracticesStore/Client";
import { formatAsCurrency, formatDate } from "../../utils";
import PracticesOfficerName from "../PracticesOfficerName";
import { ClientProfileProps } from "./types";

const DetailsSection = styled.dl``;

const DetailsHeading = styled.dt`
  color: ${palette.pine1};
  font-size: ${rem(14)};
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.14;
  margin-bottom: ${rem(spacing.sm)};
  margin-top: ${rem(spacing.lg)};
`;

const DetailsList = styled.dl``;

const DetailsSubheading = styled.dt`
  color: rgba(53, 83, 98, 0.5);
  font-size: ${rem(13)};
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.14;
  margin-bottom: ${rem(spacing.xs)};
`;

const DetailsContent = styled.dd`
  color: rgba(53, 83, 98, 0.9);
  font-size: ${rem(14)};
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.14;
`;

export const Details = observer(({ client }: ClientProfileProps) => {
  return (
    <DetailsSection>
      <DetailsHeading>Special Conditions</DetailsHeading>
      <DetailsContent>{client.specialConditions}</DetailsContent>

      <DetailsHeading>Supervision</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Expiration</DetailsSubheading>
          <DetailsContent>
            {client.expirationDate
              ? format(client.expirationDate, "MMM d, yyyy")
              : UNKNOWN}
          </DetailsContent>

          <DetailsSubheading>Assigned to</DetailsSubheading>
          <DetailsContent>
            <PracticesOfficerName officerId={client.officerId} />
          </DetailsContent>
        </DetailsList>
      </DetailsContent>

      <DetailsHeading>Contact</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Telephone</DetailsSubheading>
          <DetailsContent>{client.phoneNumber}</DetailsContent>

          <DetailsSubheading>Address</DetailsSubheading>
          <DetailsContent>{client.address}</DetailsContent>
        </DetailsList>
      </DetailsContent>

      <DetailsHeading>Fines and Fees</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Remaining</DetailsSubheading>
          <DetailsContent>
            {formatAsCurrency(client.currentBalance)}
          </DetailsContent>

          {client.lastPaymentAmount && client.lastPaymentDate && (
            <>
              <DetailsSubheading>Last Payment</DetailsSubheading>
              <DetailsContent>
                {formatAsCurrency(client.lastPaymentAmount)},{" "}
                {formatDate(client.lastPaymentDate)}
              </DetailsContent>
            </>
          )}
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
});

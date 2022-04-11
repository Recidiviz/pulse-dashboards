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
import { parseJSON } from "date-fns";
import { mapValues, toUpper } from "lodash";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { Client, UNKNOWN } from "../../PracticesStore/Client";
import { formatAsCurrency, formatPracticesDate } from "../../utils";
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

// TODO(#1735): the real type should be cleaner than this
type ParsedSpecialCondition = {
  // eslint-disable-next-line camelcase
  note_update_date: string;
  // eslint-disable-next-line camelcase
  conditions_on_date: string | null;
};

// TODO(#1735): after data/ETL change we should expect structured data
// rather than a JSON-ish string
function getSpecialConditionsMarkup(client: Client): JSX.Element {
  // we will flatten the nested lists of conditions into this
  const conditionsToDisplay: (
    | NonNullable<ParsedSpecialCondition>
    | string
  )[] = [];

  client.specialConditions.forEach((conditionsJson) => {
    try {
      const conditionsForSentence: {
        // eslint-disable-next-line camelcase
        note_update_date: string;
        // eslint-disable-next-line camelcase
        conditions_on_date: string | null;
      }[] = JSON.parse(
        // the specialConditions strings are almost valid JSON,
        // except they may include NULL instead of null as a value;
        // work around this by converting to lowercase
        conditionsJson.toLowerCase()
      );

      conditionsForSentence.forEach(
        // eslint-disable-next-line camelcase
        ({ note_update_date, conditions_on_date }) => {
          // don't display nulls
          // eslint-disable-next-line camelcase
          if (!conditions_on_date) return;

          // note that we have to convert the actual values back to uppercase
          // to display them properly
          conditionsToDisplay.push(
            mapValues({ note_update_date, conditions_on_date }, toUpper)
          );
        }
      );
    } catch (e) {
      // if we couldn't hack our way to valid JSON,
      // display the whole ugly string so there's no data loss
      conditionsToDisplay.push(conditionsJson);
    }
  });

  return (
    <>
      {!conditionsToDisplay.length && "None"}
      <DetailsList>
        {conditionsToDisplay.map((condition, i) => {
          // can't guarantee uniqueness of anything in the condition,
          // there are lots of duplicates in fact
          const key = i;

          if (typeof condition === "string") {
            return <DetailsContent key={key}>{condition}</DetailsContent>;
          }

          return (
            <React.Fragment key={key}>
              <DetailsSubheading>
                {formatPracticesDate(parseJSON(condition.note_update_date))}
              </DetailsSubheading>
              <DetailsContent>{condition.conditions_on_date}</DetailsContent>
            </React.Fragment>
          );
        })}
      </DetailsList>
    </>
  );
}

export const Details = observer(({ client }: ClientProfileProps) => {
  return (
    <DetailsSection>
      <DetailsHeading>Special Conditions</DetailsHeading>
      <DetailsContent>{getSpecialConditionsMarkup(client)}</DetailsContent>

      <DetailsHeading>Supervision</DetailsHeading>
      <DetailsContent>
        <DetailsList>
          <DetailsSubheading>Expiration</DetailsSubheading>
          <DetailsContent>
            {client.expirationDate
              ? formatPracticesDate(client.expirationDate)
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

          {client.lastPaymentAmount && client.lastPaymentDate ? (
            <>
              <DetailsSubheading>Last Payment</DetailsSubheading>
              <DetailsContent>
                {formatAsCurrency(client.lastPaymentAmount)},{" "}
                {formatPracticesDate(client.lastPaymentDate)}
              </DetailsContent>
            </>
          ) : null}
        </DetailsList>
      </DetailsContent>
    </DetailsSection>
  );
});

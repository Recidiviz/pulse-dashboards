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

import { parseJSON } from "date-fns";
import React from "react";

import * as pathwaysTenants from "../../../RootStore/TenantStore/pathwaysTenants";
import { formatWorkflowsDate } from "../../../utils";
import { Client } from "../../../WorkflowsStore";
import {
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  Divider,
  EmptySpecialConditionCopy,
  SecureDetailsContent,
  SpecialConditionsCopy,
} from "../styles";
import { ClientProfileProps } from "../types";

/**
 * Special condition strings to display when a client does not have a special condition set.
 * If the state opportunity does not support special conditions,
 * it should not have an entry here
 */
export const STATE_SPECIFIC_EMPTY_SPECIAL_CONDITION_STRINGS: Record<
  string,
  EmptySpecialConditionCopy
> = {
  [pathwaysTenants.US_TN]: {
    parole: "None according to Board Actions in TOMIS",
    probation: "None according to judgment orders in TOMIS",
  },
};

// TODO(#1735): after data/ETL change we should expect structured data
// rather than a JSON-ish string

export function ProbationSpecialConditionsMarkup(
  client: Client,
  emptySpecialConditionString: string,
): JSX.Element {
  const { formattedProbationSpecialConditions } = client;

  return (
    <>
      {!formattedProbationSpecialConditions.length &&
        emptySpecialConditionString}
      <DetailsList>
        {formattedProbationSpecialConditions.map((condition, i) => {
          // can't guarantee uniqueness of anything in the condition,
          // there are lots of duplicates in fact
          const key = i;

          if (typeof condition === "string") {
            return (
              <SecureDetailsContent key={key}>{condition}</SecureDetailsContent>
            );
          }

          return (
            <React.Fragment key={key}>
              <DetailsSubheading>
                {formatWorkflowsDate(parseJSON(condition.note_update_date))}
              </DetailsSubheading>
              <SecureDetailsContent>
                <SpecialConditionsCopy>
                  {condition.conditions_on_date}
                </SpecialConditionsCopy>
              </SecureDetailsContent>
            </React.Fragment>
          );
        })}
      </DetailsList>
    </>
  );
}

export function SpecialConditions({
  client,
}: ClientProfileProps): React.ReactElement | null {
  const emptySpecialConditionStrings =
    STATE_SPECIFIC_EMPTY_SPECIAL_CONDITION_STRINGS[client.stateCode];
  if (!emptySpecialConditionStrings) return null;

  return (
    <DetailsSection className="DetailsSection">
      <DetailsHeading>Probation Special Conditions</DetailsHeading>
      <SecureDetailsContent>
        {ProbationSpecialConditionsMarkup(
          client,
          emptySpecialConditionStrings.probation,
        )}
      </SecureDetailsContent>
      <Divider />
      <DetailsHeading>Parole Special Conditions</DetailsHeading>
      <SecureDetailsContent>
        <>
          {!client.paroleSpecialConditions?.length &&
            emptySpecialConditionStrings.parole}
          <DetailsList>
            {client.paroleSpecialConditions?.map(
              ({ condition, conditionDescription }, i) => {
                return (
                  // can't guarantee uniqueness of anything in the condition,
                  // there are lots of duplicates in fact
                  // eslint-disable-next-line react/no-array-index-key
                  <SecureDetailsContent key={i}>
                    <SpecialConditionsCopy>
                      {condition} ({conditionDescription})
                    </SpecialConditionsCopy>
                  </SecureDetailsContent>
                );
              },
            )}
          </DetailsList>
        </>
      </SecureDetailsContent>
    </DetailsSection>
  );
}

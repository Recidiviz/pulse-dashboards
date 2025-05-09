// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { captureException } from "@sentry/react";
import React from "react";
import { z } from "zod";

import {
  DetailsHeading,
  DetailsList,
  DetailsSection,
  DetailsSubheading,
  SecureDetailsContent,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

const specialConditionsSchema = z.array(
  z.object({
    specialConditionType: z.string(),
    compliance: z.string().nullable(),
  }),
);

export const UsNeSpecialConditions: React.FC<OpportunityProfileProps> = ({
  opportunity,
}) => {
  const result = specialConditionsSchema.safeParse(
    opportunity.record?.metadata?.specialConditions,
  );
  if (!result.success) {
    captureException(result.error);
    return null;
  }
  const scores = result.data;

  return (
    <DetailsSection>
      <DetailsHeading>Special Conditions</DetailsHeading>
      <SecureDetailsContent>
        <DetailsList>
          {scores.map(({ specialConditionType, compliance }) => (
            <React.Fragment key={specialConditionType}>
              <DetailsSubheading>{specialConditionType}</DetailsSubheading>
              <SecureDetailsContent>
                Compliant: {compliance ?? "Unknown"}
              </SecureDetailsContent>
            </React.Fragment>
          ))}
        </DetailsList>
      </SecureDetailsContent>
    </DetailsSection>
  );
};

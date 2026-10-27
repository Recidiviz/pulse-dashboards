// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { useFeatureVariants } from "../../../../components/StoreProvider";
import { UsIaEarlyDischargeOpportunity } from "../../../../WorkflowsStore/Opportunity/UsIa";
import {
  DetailsContent,
  DetailsHeading,
  DetailsSection,
  DetailsShadedBox,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

export const UsIaEarlyDischargeFormStatus = observer(
  function UsIaEarlyDischargeFormStatus({
    opportunity,
  }: OpportunityProfileProps): React.ReactElement<any> | null {
    const { usIaEarlyDischargeV2 } = useFeatureVariants();

    // The opportunity config decides whether this section is listed, and that
    // config doesn't know about feature variants, so users without V2 are
    // filtered out here.
    if (
      !(opportunity instanceof UsIaEarlyDischargeOpportunity) ||
      !usIaEarlyDischargeV2
    ) {
      return null;
    }

    return (
      <DetailsSection>
        <DetailsHeading>Form submission status</DetailsHeading>
        <DetailsShadedBox>
          <DetailsContent>Nothing submitted yet</DetailsContent>
        </DetailsShadedBox>
      </DetailsSection>
    );
  },
);

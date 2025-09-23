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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { Icon } from "~design-system";
import { palette } from "~design-system";

import { formatWorkflowsDate } from "../../../../utils/formatStrings";
import { UsMiCustodyLevelDowngradeOpportunity } from "../../../../WorkflowsStore/Opportunity/UsMi/UsMiCustodyLevelDowngradeOpportunity";
import {
  DetailsHeading,
  DetailsSection,
  ShadedSidebarTableCell,
  SidebarTable,
  SidebarTableCell,
  SidebarTableRow,
} from "../../styles";
import { OpportunityProfileProps } from "../../types";

const AlignedIcon = styled(Icon)`
  vertical-align: text-bottom;
`;

const NoAssessmentSince26Wrapper = styled.dd`
  margin-bottom: ${rem(spacing.sm)};
  color: ${palette.signal.notification};
`;

const SecureCopy = styled.span.attrs({
  className: "fs-exclude",
})`
  ${typography.Sans14}
`;

const NoAssessmentSince26Notice = ({ name }: { name: string }) => {
  return (
    <NoAssessmentSince26Wrapper>
      <AlignedIcon kind="Info" size={14} />{" "}
      <SecureCopy>{name} turned 26 after their most recent screen.</SecureCopy>
    </NoAssessmentSince26Wrapper>
  );
};

const UsMiLastAssessment: React.FC<OpportunityProfileProps> = ({
  opportunity,
}) => {
  if (!(opportunity instanceof UsMiCustodyLevelDowngradeOpportunity))
    return null;

  const {
    confinementLevel,
    managementLevel,
    managementLevelRawScore,
    mostRecentAssessmentDate,
    noAssessmentSince26,
  } = opportunity.record.metadata;

  const name = opportunity.person.fullName.givenNames ?? "This resident";

  const tableContents = [
    { label: "Management Level Raw Score", text: managementLevelRawScore },
    { label: "Management Level", text: managementLevel },
    { label: "Confinement Level", text: confinementLevel },
  ];

  return (
    <DetailsSection>
      <DetailsHeading>
        Most Recent Security Classification Screen (
        {formatWorkflowsDate(mostRecentAssessmentDate)})
      </DetailsHeading>
      {noAssessmentSince26 && <NoAssessmentSince26Notice name={name} />}
      <SidebarTable>
        {tableContents.map(({ label, text }) => (
          <SidebarTableRow key={label}>
            <ShadedSidebarTableCell>{label}</ShadedSidebarTableCell>
            <SidebarTableCell>{text}</SidebarTableCell>
          </SidebarTableRow>
        ))}
      </SidebarTable>
    </DetailsSection>
  );
};

export default UsMiLastAssessment;

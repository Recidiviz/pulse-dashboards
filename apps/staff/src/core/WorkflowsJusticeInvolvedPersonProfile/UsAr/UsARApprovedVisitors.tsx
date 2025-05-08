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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { Opportunity } from "../../../WorkflowsStore";
import { UsArInstitutionalWorkerStatusOpportunity } from "../../../WorkflowsStore/Opportunity/UsAr/UsArInstitutionalWorkerStatusOpportunity/UsArInstitutionalWorkerStatusOpportunity";
import { DetailsHeading, Divider } from "../styles";

const Heading = styled(DetailsHeading)`
  margin-bottom: 0;
  padding-bottom: ${rem(spacing.sm)};
  padding-top: ${rem(spacing.sm)};
`;

export function UsArApprovedVisitors({
  opportunity,
}: {
  opportunity: Opportunity;
}): React.ReactElement | null {
  if (!(opportunity instanceof UsArInstitutionalWorkerStatusOpportunity))
    return null;

  return (
    <>
      <Divider />
      <Heading>Approved Visitors {`(${opportunity.numVisitors()})`}</Heading>
    </>
  );
}

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

import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components";

import { ProgrammingMetadata } from "~datatypes";
import { palette } from "~design-system";

import { formatWorkflowsDate } from "../../../utils";
import {
  DetailsBox,
  DetailsContent,
  DetailsHeading,
  DetailsSection,
  DetailsSubheading,
} from "../styles";
import { OpportunityProfileProps } from "../types";

const ProgrammingBox = styled(DetailsBox)`
  padding: ${rem(spacing.md)} 12px ${rem(spacing.sm)} 12px;
`;
const Row = styled.div`
  display: flex;
  align-items: center;
`;

const Title = styled(DetailsContent)`
  color: ${palette.text.secondary};
`;

function ProgrammingEntry({
  metadata,
}: {
  metadata: ProgrammingMetadata;
}): React.ReactElement<any> | null {
  const {
    program,
    programStatus,
    programEndReason,
    startDate,
    endDate,
    referralDate,
  } = metadata;
  return (
    <ProgrammingBox>
      <Row>
        <Title>{`Program: ${program}`}</Title>
      </Row>
      {programStatus && (
        <Row>
          <DetailsContent>
            {`Status: ${programStatus}` +
              (programEndReason ? ` - ${programEndReason}` : ``)}
          </DetailsContent>
        </Row>
      )}

      {referralDate && (
        <Row>
          <DetailsContent>{`Referred on ${formatWorkflowsDate(referralDate)}`}</DetailsContent>
        </Row>
      )}
      {startDate && (
        <Row>
          <DetailsContent>{`Start Date: ${formatWorkflowsDate(startDate)}`}</DetailsContent>
        </Row>
      )}
      {endDate && (
        <Row>
          <DetailsContent>{`End Date: ${formatWorkflowsDate(endDate)}`}</DetailsContent>
        </Row>
      )}
    </ProgrammingBox>
  );
}

export const Programming = observer(function Programming({
  opportunity,
}: OpportunityProfileProps): React.ReactElement<any> | null {
  const programming: ProgrammingMetadata[] | undefined =
    opportunity.record?.metadata?.programming;
  if (!programming) {
    return null;
  }

  const sortedProgramming = programming.toSorted((a, b) => {
    if (a.referralDate && !b.referralDate) return -1;
    if (b.referralDate && !a.referralDate) return 1;
    if (a.referralDate && b.referralDate)
      return b.referralDate.getTime() - a.referralDate.getTime();
    return 0;
  });
  return (
    <DetailsSection>
      <DetailsHeading>Programming</DetailsHeading>
      {!sortedProgramming.length ? (
        <DetailsSubheading>No Programming History</DetailsSubheading>
      ) : (
        <>
          <DetailsSubheading>Sorted by referral date</DetailsSubheading>
          {sortedProgramming.map((metadata) => (
            <ProgrammingEntry metadata={metadata} />
          ))}
        </>
      )}
    </DetailsSection>
  );
});

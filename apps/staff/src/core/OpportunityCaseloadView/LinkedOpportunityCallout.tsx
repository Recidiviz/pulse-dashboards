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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import simplur from "simplur";
import styled from "styled-components/macro";

// TODO(#6719): Combine this with the one in OpportunityCaseHighlights
const Container = styled.section`
  ${typography.Sans14}
  color: ${palette.pine2};

  background-color: #fff5f5;
  border-color: ${palette.signal.error};
  border-style: solid;
  border-width: 0 0 0 ${rem(spacing.xs)};

  padding: ${rem(spacing.md)};
  padding-left: ${rem(22)};
  margin-top: ${rem(spacing.sm)};
  margin-bottom: ${rem(spacing.xl)};

  width: 100%;
`;

const Overdue = styled.strong`
  text-transform: uppercase;
`;

const OverdueLink = styled(Link)`
  color: ${palette.pine4};
  text-decoration: underline;

  &:hover {
    color: ${palette.pine4};
    text-decoration: underline;
  }
`;

// TODO(#6720): Add tests for this and the associated fields on the presenter
export const LinkedOpportunityCallout = function LinkedOpportunityCallout({
  overdueOpportunityCount,
  overdueOpportunityUrl,
  overdueOpportunityCalloutCopy,
}: {
  overdueOpportunityCount: number;
  overdueOpportunityUrl?: string;
  overdueOpportunityCalloutCopy: string;
}): ReactNode {
  if (!overdueOpportunityUrl || overdueOpportunityCount === 0) return;

  return (
    <Container>
      <Overdue>Overdue:</Overdue>{" "}
      {simplur`There [is|are] ${overdueOpportunityCount} [person|people] that [is|are] ${overdueOpportunityCalloutCopy}. `}
      Please check out the{" "}
      <OverdueLink to={overdueOpportunityUrl}>outstanding cases</OverdueLink> on
      the selected caseload(s).
    </Container>
  );
};
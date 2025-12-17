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

import { rem } from "polished";
import styled from "styled-components";

import { Card, GoLink, SlateCopy } from "~@jii/common-ui";
import { CardValue } from "~@jii/common-ui";
import { hydrateTemplate, useSingleResidentContext } from "~@jii/data";
import { spacing } from "~design-system";

export const Headline = styled(CardValue)`
  margin-bottom: ${rem(spacing.lg)};
`;

export type TodoCardProps = {
  title: string;
  body: string;
  linkText: string;
  linkTarget: string;
};

export function TodoCard({ title, body, linkText, linkTarget }: TodoCardProps) {
  const { resident, opportunities: rawOpps } = useSingleResidentContext();
  const opportunities = Object.fromEntries(
    rawOpps.map((opp) => [opp.opportunityId, opp.opportunityRecord]),
  );
  return (
    <Card>
      <Headline>{title}</Headline>
      <SlateCopy options={{ forceBlock: true }}>
        {hydrateTemplate(body, { ...resident, ...opportunities })}
      </SlateCopy>
      <GoLink to={linkTarget}>{linkText}</GoLink>
    </Card>
  );
}
